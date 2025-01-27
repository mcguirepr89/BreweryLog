#!/usr/bin/env bash
# Switch over to BreweryLog

BACKENDDIR=./backend
DIRS=("./backend" "./frontend")

# Edit docker-compose.yml
sed -i '/ghcr/d;s/adventure/brewery/g;s/#build/build/g' docker-compose.yml

# Remove all old migrations
find $BACKENDDIR -path "*/migrations/*.py" -not -name "__init__.py" -delete
find $BACKENDDIR -path "*/migrations/*.pyc"  -delete

# Edit entrypoint.sh
sed -i '/Apply/a python manage.py makemigrations' $BACKENDDIR/entrypoint.sh

# Replace all adventure instances with brewery stuff
for dirs in ${DIRS[@]};do
    # Rename files
    find $dirs -name '*Adventure*' -exec rename 's/Adventure/Brewery/g' {} \;
    find $dirs -name '*adventure*' -exec rename 's/adventure/brewery/g' {} \;
    find $dirs -name '*adventure*' -exec rename 's/adventure/brewery/g' {} \;
    find $dirs -name '*Brewerys*' -exec rename 's/Brewerys/Breweries/g' {} \;
    find $dirs -name '*brewerys*' -exec rename 's/brewerys/breweries/g' {} \;
    
    # Replace all references
    sed -i 's/Adventure/Brewery/g' $(grep -IRl 'Adventure' $dirs)
    sed -i 's/adventure/brewery/g' $(grep -IRl 'adventure' $dirs)
    sed -i 's/Brewerys/Breweries/g' $(grep -IRl 'Brewerys' $dirs)
    sed -i 's/brewerys/breweries/g' $(grep -IRl 'brewerys' $dirs)
done
