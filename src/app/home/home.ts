import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private router = inject(Router);

  goToSignup(): void {
    // console.log('Signup clicked');
    this.router.navigate(['/signup']);
  }

  goToLogin(): void{
    this.router.navigate(['/login']);
  }
}
