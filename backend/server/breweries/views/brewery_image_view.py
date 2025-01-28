from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from breweries.models import Brewery, BreweryImage
from breweries.serializers import BreweryImageSerializer
import uuid

class BreweryImageViewSet(viewsets.ModelViewSet):
    serializer_class = BreweryImageSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def image_delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def toggle_primary(self, request, *args, **kwargs):
        # Makes the image the primary image for the brewery, if there is already a primary image linked to the brewery, it is set to false and the new image is set to true. make sure that the permission is set to the owner of the brewery
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        instance = self.get_object()
        brewery = instance.brewery
        if brewery.user_id != request.user:
            return Response({"error": "User does not own this brewery"}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if the image is already the primary image
        if instance.is_primary:
            return Response({"error": "Image is already the primary image"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set the current primary image to false
        BreweryImage.objects.filter(brewery=brewery, is_primary=True).update(is_primary=False)

        # Set the new image to true
        instance.is_primary = True
        instance.save()
        return Response({"success": "Image set as primary image"})

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        brewery_id = request.data.get('brewery')
        try:
            brewery = Brewery.objects.get(id=brewery_id)
        except Brewery.DoesNotExist:
            return Response({"error": "Brewery not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if brewery.user_id != request.user:
            # Check if the brewery has a collection
            if brewery.collection:
                # Check if the user is in the collection's shared_with list
                if not brewery.collection.shared_with.filter(id=request.user.id).exists():
                    return Response({"error": "User does not have permission to access this brewery"}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({"error": "User does not own this brewery"}, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        brewery_id = request.data.get('brewery')
        try:
            brewery = Brewery.objects.get(id=brewery_id)
        except Brewery.DoesNotExist:
            return Response({"error": "Brewery not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if brewery.user_id != request.user:
            return Response({"error": "User does not own this brewery"}, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def perform_destroy(self, instance):
        print("perform_destroy")
        return super().perform_destroy(instance)

    def destroy(self, request, *args, **kwargs):
        print("destroy")
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        instance = self.get_object()
        brewery = instance.brewery
        if brewery.user_id != request.user:
            return Response({"error": "User does not own this brewery"}, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        instance = self.get_object()
        brewery = instance.brewery
        if brewery.user_id != request.user:
            return Response({"error": "User does not own this brewery"}, status=status.HTTP_403_FORBIDDEN)
        
        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=False, methods=['GET'], url_path='(?P<brewery_id>[0-9a-f-]+)')
    def brewery_images(self, request, brewery_id=None, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            brewery_uuid = uuid.UUID(brewery_id)
        except ValueError:
            return Response({"error": "Invalid brewery ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = BreweryImage.objects.filter(
            Q(brewery__id=brewery_uuid) & Q(user_id=request.user)
        )
        
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def get_queryset(self):
        return BreweryImage.objects.filter(user_id=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user)