# BACKEND-PLACEHOLDER-START
"""
Placeholder session middleware for Client Portal.
Does not enforce any checks; passes request through unchanged.
"""


class ClientPortalSessionMiddleware:
    # BACKEND-PLACEHOLDER-START
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
