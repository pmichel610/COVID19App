import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CountrypageComponent } from './countrypage/countrypage.component';
import { SigninComponent } from './signin/signin.component';

const routes: Routes = [
  { path: "signin", component: SigninComponent},
  { path: "countrypage", component: CountrypageComponent},
  { path: "", pathMatch: "full", redirectTo: "signin"},
  { path: "**", redirectTo: "signin"}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
