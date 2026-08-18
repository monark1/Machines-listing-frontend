import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from "./notification-toast/notification-toast";
import { AuthService } from './services/auth.service';
import { NavbarComponent } from "./navbar/navbar";
import { ReauthOverlayComponent } from './reauth-overlay/reauth-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationToastComponent, NavbarComponent, ReauthOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('task');
  authService = inject(AuthService);
}
