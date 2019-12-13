import { PlaceLocation } from './location.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, delay, switchMap, switchAll } from 'rxjs/operators';

import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { ThrowStmt } from '@angular/compiler';


// [

// Sin http
// new Place(
//   'p1',
//   'Manhattan Mansion',
//   'In the heart of New York City.',
//   'https://lonelyplanetimages.imgix.net/mastheads/GettyImages-538096543_medium.jpg?sharp=10&vib=20&w=1200',
//   149.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
// ),
// new Place(
//   'p2',
//   'L\'Amour Toujours',
//   'A romantic place in Paris!',
//   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Paris_Night.jpg/1024px-Paris_Night.jpg',
//   189.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
// ),
// new Place(
//   'p3',
//   'The Foggy Palace',
//   'Not your average city trip!',
//   'https://upload.wikimedia.org/wikipedia/commons/0/01/San_Francisco_with_two_bridges_and_the_fog.jpg',
//   99.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
// )
// Con http
// ]

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  generatedId: string;
  updatedPlaces: PlaceData[];
  private placeUrl = 'https://ionic-angular-course-2f7ed.firebaseio.com/offered-places.json';
  private placesUrl = 'https://ionic-angular-course-2f7ed.firebaseio.com/offered-places';
  private uploadUrl = 'https://us-central1-ionic-angular-course-2f7ed.cloudfunctions.net/storeImage';
  // tslint:disable-next-line: variable-name
  private _places = new BehaviorSubject<Place[]>([]);

  get places() {
    return this._places.asObservable();
  }

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }



  // Obtener lugares
  fetchPlaces() {
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http
          .get<{ [key: string]: PlaceData }>(
            `${this.placeUrl}?auth=${token}`
          );
      }),
      map(resData => {
        const places = [];

        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
              )
            );
          }
        }
        // Se devuelve el array de lugares
        return places;
      }),
      // Se captura el array de lugares y se actualiza la lista de lugares
      tap(places => {
        this._places.next(places);
      })
    );
  }



  // Obtener lugar
  getPlace(id: string) {
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.get<PlaceData>(
          `${this.placesUrl}/${id}.json?auth=${token}`
        );
      }),
      // Previene la perdida de datos si se recarga la página
      map(placeData => {
        return new Place(
          id,
          placeData.title,
          placeData.description,
          placeData.imageUrl,
          placeData.price,
          new Date(placeData.availableFrom),
          new Date(placeData.availableTo),
          placeData.userId,
          placeData.location
        );
      })
    );
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.post<{ imageUrl: string, imagePath: string }>(`${this.uploadUrl}`,
          uploadData,
          { headers: { Authorization: 'Bearer ' + token } }
        );
      })
      );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    location: PlaceLocation,
    imageUrl: string
  ) {
    let generatedId: string;
    let fetchedUserId: string;
    let newPlace: Place;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        if (!fetchedUserId) {
          throw new Error('No user found!');
        }
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          imageUrl,
          price,
          dateFrom,
          dateTo,
          fetchedUserId,
          location
        );
        return this.http.post<{ name: string }>(
          `${this.placeUrl}?auth=${token}`,
          {
            ...newPlace,
            id: null
          }
        );
      }),
      switchMap(resData => {
        generatedId = resData.name;
        return this.places;
      }),
      take(1),
      tap(places => {
        newPlace.id = generatedId;
        this._places.next(places.concat(newPlace));
      })
    );
  }

  // metodo para actualizar ofertas. Construido así se garantiza que siempre
  // existirá un lugar para actualizar
  updatePlace(id: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let fetchedToken: string;
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        fetchedToken = token;
        return this.places;
      }),
      take(1),
      // Se obtiene la lista de lugares en el observable switchMap
      // Se actualiza y se construye un nuevo lugar actualizado
      switchMap(places => {
        // Si se ha perdido el lugar, se actualiza
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          // Si no se ha perdido, se emite el lugar
          return of(places);
        }
      }),
      // se actualiza la lista local de lugares y se emite
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id === id);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.http.put(
          `${this.placesUrl}/${id}.json?auth=${fetchedToken}`,
          // se establece la id a null, ya que firebase la gestiona
          { ...updatedPlaces[updatedPlaceIndex], id: null }
        );
      }),
      tap(() => {
        this._places.next(updatedPlaces);
      })
    );

  }
}
