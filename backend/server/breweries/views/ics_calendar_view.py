from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from icalendar import Calendar, Event, vText, vCalAddress
from datetime import datetime, timedelta
from breweries.models import Brewery
from breweries.serializers import BrewerySerializer

class IcsCalendarGeneratorViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def generate(self, request):
        breweries = Brewery.objects.filter(user_id=request.user)
        serializer = BrewerySerializer(breweries, many=True)
        user = request.user
        name = f"{user.first_name} {user.last_name}"
        print(serializer.data)
        
        cal = Calendar()
        cal.add('prodid', '-//My Brewery Calendar//example.com//')
        cal.add('version', '2.0')

        for brewery in serializer.data:
            if brewery['visits']:
                for visit in brewery['visits']:
                    # Skip if start_date is missing
                    if not visit.get('start_date'):
                        continue

                    # Parse start_date and handle end_date
                    try:
                        start_date = datetime.strptime(visit['start_date'], '%Y-%m-%d').date()
                    except ValueError:
                        continue  # Skip if the start_date is invalid

                    end_date = (
                        datetime.strptime(visit['end_date'], '%Y-%m-%d').date() + timedelta(days=1)
                        if visit.get('end_date') else start_date + timedelta(days=1)
                    )
                    
                    # Create event
                    event = Event()
                    event.add('summary', brewery['name'])
                    event.add('dtstart', start_date)
                    event.add('dtend', end_date)
                    event.add('dtstamp', datetime.now())
                    event.add('transp', 'TRANSPARENT')
                    event.add('class', 'PUBLIC')
                    event.add('created', datetime.now())
                    event.add('last-modified', datetime.now())
                    event.add('description', brewery['description'])
                    if brewery.get('location'):
                        event.add('location', brewery['location'])
                    if brewery.get('link'):
                        event.add('url', brewery['link'])
                    
                    organizer = vCalAddress(f'MAILTO:{user.email}')
                    organizer.params['cn'] = vText(name)
                    event.add('organizer', organizer)
                
                    cal.add_component(event)
        
        response = HttpResponse(cal.to_ical(), content_type='text/calendar')
        response['Content-Disposition'] = 'attachment; filename=breweries.ics'
        return response