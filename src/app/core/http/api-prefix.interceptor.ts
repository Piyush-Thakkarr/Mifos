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

    const versionRegex = /^\/(v[1-9][0-9]*\/).*$/;
    if (versionRegex.test(request.url)) {
      baseUrl = this.settingsService.baseServerUrl;
    }
    if (request.url.includes('/actuator/')) {
      // Use relative path for actuator requests to go through Angular proxy
      // This bypasses SSL certificate issues in development
      const serverHost = this.settingsService.serverHost;
      // If serverHost is localhost, use relative path (empty string) to use proxy
      if (serverHost && (serverHost.includes('localhost') || serverHost.includes('127.0.0.1'))) {
        baseUrl = '';
      } else {
        baseUrl = serverHost;
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
