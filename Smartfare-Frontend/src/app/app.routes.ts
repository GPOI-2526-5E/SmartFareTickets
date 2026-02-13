import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: "", redirectTo: "/search", pathMatch: "full"},
    {path: "home", component: HomeComponent}
];
