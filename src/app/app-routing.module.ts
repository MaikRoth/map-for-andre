import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ControlpanelComponent } from './controlpanel/controlpanel.component';
import { MapComponent } from './map/map.component';

const routes: Routes = [
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
