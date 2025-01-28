from django.db import models
from django.db.models import Q

class BreweryManager(models.Manager):
    def retrieve_breweries(self, user, include_owned=False, include_shared=False, include_public=False):
        # Initialize the query with an empty Q object
        query = Q()

        # Add owned breweries to the query if included
        if include_owned:
            query |= Q(user_id=user.id)

        # Add shared breweries to the query if included
        if include_shared:
            query |= Q(collection__shared_with=user.id)

        # Add public breweries to the query if included
        if include_public:
            query |= Q(is_public=True)

        # Perform the query with the final Q object and remove duplicates
        return self.filter(query).distinct()
