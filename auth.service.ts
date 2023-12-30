import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from 'src/environment/environment.dev';
import { ILogin } from '../interface/login.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(user: Partial<ILogin>): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${environment.BASE_URL}auth/login`, user).pipe(
      tap(({ token })=> { localStorage.setItem('token', JSON.stringify({ user: user.email, token }) ) })
    );
  }

  register(user: Partial<ILogin>): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${environment.BASE_URL}auth/registration`, user).pipe(
      tap(({ token })=> { localStorage.setItem('token', JSON.stringify({ user: user.email, token }) ) })
    );
  }

  checkAuth() {
    localStorage.getItem('token')
  }
}