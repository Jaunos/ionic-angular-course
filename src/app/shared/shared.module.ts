import { ImagePickerComponent } from './pickers/image-picker/image-picker.component';
import { LocationPickerComponent } from './pickers/location-picker/location-picker.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapModalComponent } from './map-modal/map-modal.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    LocationPickerComponent,
    MapModalComponent,
    ImagePickerComponent
  ],
  declarations: [
    LocationPickerComponent,
    MapModalComponent,
    ImagePickerComponent
  ],
  entryComponents: [
    MapModalComponent
  ]
})
export class SharedModule { }
