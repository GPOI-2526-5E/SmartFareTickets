import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SearchComponent } from './components/search/search.component';

export const routes: Routes = [
    {path: "", redirectTo: "/search", pathMatch: "full"},
    {path: "search", component: SearchComponent},
    {path: "home", component: HomeComponent}
];
