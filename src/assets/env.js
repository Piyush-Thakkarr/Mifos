(function (window) {
  window['env'] = window['env'] || {};

  // For local development: Use empty string to make URLs relative
  // The Angular proxy will intercept /fineract-provider/* and forward to Fineract
  // This bypasses SSL certificate errors
  // NOTE: Empty string is falsy, so environment.ts will use fallback, but we can work around this
  // by setting it to a special value that environment.ts will use
  window['env']['fineractApiUrl'] = ''; // Empty = relative URLs = proxy works
  window['env']['fineractApiUrls'] = '';

  window['env']['apiProvider'] = '/fineract-provider/api';
  window['env']['apiVersion'] = '/v1';

  window['env']['fineractPlatformTenantId'] = 'default';
  window['env']['fineractPlatformTenantIds'] = 'default';

  // Client Portal Django API URL
  window['env']['djangoApiUrl'] = 'http://localhost:8000';
})(this);
