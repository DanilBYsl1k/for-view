import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor<T> implements HttpInterceptor {
  private cache: Map<HttpRequest, HttpResponse> = new Map();

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<T>> {
    if (request.method !== 'GET') {

      return next.handle(request);
    }

    const cacheKey = request.urlWithParams;

    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      return of(new HttpResponse({ body: cachedData }));
    }

    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.cache.set(cacheKey, event.body);
        }
      })
    );
  }
}