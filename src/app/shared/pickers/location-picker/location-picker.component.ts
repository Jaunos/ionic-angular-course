import { PlaceLocation, Coordinates } from '../../../places/location.model';
import { environment } from './../../../../environments/environment';

import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Plugins, Capacitor } from '@capacitor/core';


@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {

  // Emitter, emite la localización a new offer
  @Output() locationPick = new EventEmitter<PlaceLocation>();

  // Emitter para mostrar vista previa
  @Input() showPreview = false;

  selectedLocationImage: string;
  isLoading = false;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    // Capacitor
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() { }

  onPickLocation() {
    this.actionSheetCtrl.create(
      {
        header: 'Please Choose',
        buttons: [
          {
            text: 'Auto-Locate',
            handler: () => {
              this.locateUser();
            }
          },
          {
            text: 'Pick on Map',
            handler: () => {
              this.openMap();
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }

        ]
      }
    ).then(
      actionSheetEl => {
        actionSheetEl.present();
      });
  }

  private locateUser() {
    // Si no está disponible la geolocalización
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }
    this.isLoading = true;
    Plugins.Geolocation.getCurrentPosition()
      .then(geoPosition => {
        const coordinates: Coordinates = {
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude,
        };
        this.createPlace(coordinates.lat, coordinates.lng);
        this.isLoading = false;
      })
      .catch(err => {
        this.isLoading = false;
        this.showErrorAlert();
      });
  }

  private showErrorAlert() {
    this.alertCtrl.create(
      {
        header: 'Could not fetch location',
        message: 'Please use the map to pick a location!'
      }
    ).then(alertEl => alertEl.present());
  }

  private openMap() {
    this.modalCtrl.create(
      {
        component: MapModalComponent
      }
    ).then(modalEl => {
      modalEl.onDidDismiss()
        .then(modalData => {
          // Si modalData es undefinded. Si se cancela antes en vez de crear posicion
          // Se vuelve
          if (!modalData.data) {
            return;
          }
          const coordinates: Coordinates = {
            lat: modalData.data.lat,
            lng: modalData.data.lng
          }
          this.createPlace(coordinates.lat, coordinates.lng);
        });
      modalEl.present();
    });
  }

  private createPlace(lat: number, lng: number) {
    // Location Modal
    const pickedLocation: PlaceLocation = {
      // tslint:disable-next-line: object-literal-shorthand
      lat: lat,
      // tslint:disable-next-line: object-literal-shorthand
      lng: lng,
      address: null,
      staticMapImageUrl: null
    };
    this.isLoading = true;
    this.getAddress(lat, lng)
      .pipe(
        switchMap(address => {
          // Se realiza una petición http y
          // se almacena la dirección y la captura de la imagen
          pickedLocation.address = address;
          // Se genera un observable / emmiter
          console.log(address);
          console.log(pickedLocation);
          return of(this.getMapImage(
            pickedLocation.lat,
            pickedLocation.lng,
            14
          ));
        })
      ).subscribe(staticMapImageUrl => {
        // Se obtiene la imagen
        pickedLocation.staticMapImageUrl = staticMapImageUrl;
        this.selectedLocationImage = staticMapImageUrl;
        this.isLoading = false;
        this.locationPick.emit(pickedLocation);
      });

  }

  // Metodo que obtiene la dirección al hacer click en el mapa.
  // GEOLOCATION API - https://developers.google.com/maps/documentation/geocoding/start
  private getAddress(lat: number, lng: number) {
    return this.http.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${environment.googleMapsAPIKey}`)
      .pipe(
        map((geoData: any) => {
          // Se verifica si obtuvimos geodatos
          if (!geoData || !geoData.results || geoData.results.length === 0) {
            return null;
          }
          // Si existen datos se devuelve el primer elemento formateado a dirección
          return geoData.results[0].formatted_address;
        })
      );
  }

  // Metodo que obtiene la imagen al hacer click en el mapa
  // GOOGLE STATIC MAP API - https://developers.google.com/maps/documentation/maps-static/intro
  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
    &markers=color:red%7Clabel:Place%7C${lat},${lng}
    &key=${environment.googleMapsAPIKey}`;
  }
}
