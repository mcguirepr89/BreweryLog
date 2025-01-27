from django.urls import include, path
from rest_framework.routers import DefaultRouter
from breweries.views import *

router = DefaultRouter()
router.register(r'breweries', BreweryViewSet, basename='breweries')
router.register(r'collections', CollectionViewSet, basename='collections')
router.register(r'stats', StatsViewSet, basename='stats')
router.register(r'generate', GenerateDescription, basename='generate')
router.register(r'activity-types', ActivityTypesView, basename='activity-types')
router.register(r'transportations', TransportationViewSet, basename='transportations')
router.register(r'notes', NoteViewSet, basename='notes')
router.register(r'checklists', ChecklistViewSet, basename='checklists')
router.register(r'images', BreweryImageViewSet, basename='images')
router.register(r'reverse-geocode', ReverseGeocodeViewSet, basename='reverse-geocode')
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'ics-calendar', IcsCalendarGeneratorViewSet, basename='ics-calendar')
router.register(r'overpass', OverpassViewSet, basename='overpass')


urlpatterns = [
    # Include the router under the 'api/' prefix
    path('', include(router.urls)),
]
