import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ControlpanelComponent } from './controlpanel/controlpanel.component';
import { MapComponent } from './map/map.component';

const routes: Routes = [
  {path: 'controlpanel', component: ControlpanelComponent},
  {path: 'map', component: MapComponent},
  {path: '', redirectTo: '/controlpanel', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
