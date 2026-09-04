import { Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logout',
  imports: [MatIconModule, MatAnchor,RouterLink],
  templateUrl: './logout.html',
  styleUrl: './logout.scss',
})
export class Logout {}