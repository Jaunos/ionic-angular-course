import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { Capacitor, Plugins, CameraSource, CameraResultType } from '@capacitor/core';
import { Platform } from '@ionic/angular';


// INSTALAR PWA ELEMENTS, USO DE CAMARA DESDE NAVEGADOR
// https://capacitor.ionicframework.com/docs/pwa-elements/#installation

// npm install @ionic/pwa-elements

/*
import { defineCustomElements } from '@ionic/pwa-elements/loader';

defineCustomElements(window);


EN INDEX HTML
<script type="module" src="https://unpkg.com/@ionic/pwa-elements@latest/dist/ionicpwaelements/ionicpwaelements.esm.js"></script>
<script nomodule src="https://unpkg.com/@ionic/pwa-elements@latest/dist/ionicpwaelements/ionicpwaelements.js"></script>

*/

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {

  // Obtiene el input hijo para almacenar archivos
  @ViewChild('filePicker', { static: false }) filePickerRef: ElementRef<HTMLInputElement>;

  // Emmiter que se captura en new offer page
  @Output() imagePick = new EventEmitter<string | File>();

  // Emitter para mostrar vista previa
  @Input() showPreview = false;

  selectedImage: string;
  userPicker = false;

  // Platform determina desde que plataforma se intenta
  // usar el componente
  constructor(private platform: Platform) { }

  ngOnInit() {
    // console.log('Mobile', this.platform.is('mobile'));
    // console.log('Hybrid', this.platform.is('hybrid'));
    // console.log('IOS', this.platform.is('ios'));
    // console.log('Android', this.platform.is('android'));
    // console.log('Desktop', this.platform.is('desktop'));

    if (
      this.platform.is('mobile') &&
      !this.platform.is('hybrid') ||
      this.platform.is('desktop')
    ) {
      this.userPicker = true;
    }
  }


  onPickImage() {
    // Si la camara no esta disponible
    if (!Capacitor.isPluginAvailable('Camera') || this.userPicker) {
      // Se abre un selector de archivos
      this.filePickerRef.nativeElement.click();
      return;
    }
    Plugins.Camera.getPhoto({
      // Calidad de foto media
      quality: 50,
      // Se pide permiso para galeria
      source: CameraSource.Prompt,
      // Ordena las fotos correctamente,
      // aunque se hayan tomado en vertical
      correctOrientation: true,
      height: 320,
      width: 600,
      // Se codifica la imagen en una cadena que se puede convertir
      // en archivo
      resultType: CameraResultType.Base64
    }).then(image => {
      this.selectedImage = image.base64String;
      this.imagePick.emit(image.base64String);
    }).catch(error => {
      if (this.userPicker) {
        this.filePickerRef.nativeElement.click();
      }
      return false;
    });
  }

  onFileChosen(event: Event) {
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if (!pickedFile) {
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = fr.result.toString();
      this.selectedImage = dataUrl;
      this.imagePick.emit(pickedFile);
    };
    fr.readAsDataURL(pickedFile);
  }

  // Instalar firebase tools para almacenar archivos en firebase
  // - npm install -g firebase-tools
  /*
     Configurar firebase
     - firebase login
     - firebase init
     - seleccionar proyecto
     - Seleccionar lenguaje
     - eslint, no
     - install dependencies,  yes
     - en index.js añadir la logica
     - en package.json añadir en dependencies:
        - Comprobar version -
        "@google-cloud/storage": "^4.1.1",
        "busboy": "^0.3.1",
        "cors": "^2.8.5",
        "uuid": "^3.3.3"
      - cd functions
      - npm install
      - cd..
      - firebase deploy
  */
}
