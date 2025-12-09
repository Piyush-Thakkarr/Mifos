/** Angular Imports */
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

/** rxjs Imports */
import { Observable } from 'rxjs';

/** Environment Configuration */
import { SettingsService } from 'app/settings/settings.service';

/**
 * Http request interceptor to prefix a request with `serverUrl`.
 */
@Injectable()
export class ApiPrefixInterceptor implements HttpInterceptor {
  /**
   * @param {SettingsService} settingsService Settings Service
   */
  constructor(private settingsService: SettingsService) {}

  /**
   * Intercepts a Http request and prefixes it with `serverUrl`.
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let baseUrl = this.settingsService.serverUrl;
    const serverHost = this.settingsService.serverHost;
    
    // Check if we're in development mode (localhost)
    const isDevelopment = serverHost && (serverHost.includes('localhost') || serverHost.includes('127.0.0.1'));

    const versionRegex = /^\/(v[1-9][0-9]*\/).*$/;
    if (versionRegex.test(request.url)) {
      baseUrl = this.settingsService.baseServerUrl;
    }
    
    // In development mode: use relative paths for ALL API requests to go through Angular proxy
    // This bypasses SSL certificate issues with self-signed certificates
    // In production: use full URLs from window.env (direct connection)
    if (isDevelopment) {
      // For development, use relative paths so requests go through proxy
      // This applies to all Fineract API requests (authentication, actuator, etc.)
      if (request.url.includes('/actuator/') || 
          request.url.includes('/fineract-provider/') ||
          request.url.startsWith('/authentication') ||
          request.url.startsWith('/self/') ||
          request.url.startsWith('/users/') ||
          request.url.startsWith('/clients/') ||
          request.url.startsWith('/loans/') ||
          request.url.startsWith('/savingsaccounts/') ||
          request.url.startsWith('/api/') ||
          request.url.startsWith('/v1/')) {
        baseUrl = '';
      }
    } else {
      // Production: use full URLs from environment
      if (request.url.includes('/actuator/')) {
        baseUrl = serverHost || '';
      }
    }

    /**
     * Ignore URLs that are complete for i18n
     */
    if (!request.url.includes('http:') && !request.url.includes('https:')) {
      request = request.clone({ url: baseUrl + request.url });
    }
    return next.handle(request);
  }
}
