## Huge thanks to Sean Morley [(@seanmorley15)](https://github.com/seanmorley15) for creating such a well-made project 🍺

This is a fork of [Sean Morley's](https://seanmorley.com/) [AdventureLog](https://github.com/seanmorley15/AdventureLog/) that is dedicated to tracking visits to breweries. And, yes, I already know about Untappd and agree it's already perfectly suited for this task :smile: -- I just wanted to tinker 🍻

# How to set this up
- Clone the repo:
  ```
  git clone https://github.com/mcguirepr89/BreweryLog.git
  ```
- Change to the BreweryLog directory:
  ```
  cd BreweryLog
  ```
- Edit `docker-compose.yml` to configure your installation. See the original [AdventureLog documentation](https://adventurelog.app/docs/install/docker.html) regarding configuration parameters.
- Then run `prepare.sh` from the `BreweryLog` directory:
  ```
  ./prepare.sh
  ```
- Then build everything:
  ```
  docker compose build -d && docker logs -f brewerylog-backend
  ```

# About `prepare.sh`
- First, we won't be pulling the images from the ghcr.io repo, but will instead build them against our customizations.
```
#!/usr/bin/env bash
# Switch over to BreweryLog

BACKENDDIR=./backend
DIRS=("./backend" "./frontend")

# Edit docker-compose.yml
sed -i '/ghcr/d;s/adventure/brewery/g;s/#build/build/g' docker-compose.yml
```
- Then we need to remove all of the AdventureLog migrations since we're replacing the `adventure` model with the `brewery` model:
```
# Remove all old migrations
find $BACKENDDIR -path "*/migrations/*.py" -not -name "__init__.py" -delete
find $BACKENDDIR -path "*/migrations/*.pyc"  -delete
```
- And since we removed the old migrations, we need to make the new ones. This adds the `python manage.py makemigrations` to the `entrypoint.sh` script just before migrating the database:
```
# Edit entrypoint.sh
sed -i '/Apply/a python manage.py makemigrations' $BACKENDDIR/entrypoint.sh
```
- Finally, we replace all instances of "adventure" with "brewery", taking into account pluralization etc.:
```
# Replace all adventure instances with brewery stuff
for dirs in ${DIRS[@]};do
    # Rename files
    find $dirs -name '*Adventure*' -exec rename 's/Adventure/Brewery/g' {} \;
    find $dirs -name '*adventure*' -exec rename 's/adventure/brewery/g' {} \;
    find $dirs -name '*adventure*' -exec rename 's/adventure/brewery/g' {} \; # <--- Doing this twice is easy enough and saves me from having to figure out why the first time misses a few files
    find $dirs -name '*Brewerys*' -exec rename 's/Brewerys/Breweries/g' {} \;
    find $dirs -name '*brewerys*' -exec rename 's/brewerys/breweries/g' {} \;
    
    # Replace all references
    sed -i 's/Adventure/Brewery/g' $(grep -IRl 'Adventure' $dirs)
    sed -i 's/adventure/brewery/g' $(grep -IRl 'adventure' $dirs)
    sed -i 's/Brewerys/Breweries/g' $(grep -IRl 'Brewerys' $dirs)
    sed -i 's/brewerys/breweries/g' $(grep -IRl 'brewerys' $dirs)

    # Fix github links to be sure source code and attribution is provided with app
    sed -i 's/github.com\/seanmorley15/github.com\/mcguirepr89/g' $(grep -IRl 'github.com/seanmorley15' $dirs)
done
```

## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.

## Acknowledgements

- Logo Design by [nordtechtiger](https://github.com/nordtechtiger)
- WorldTravel Dataset [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database)

### Top Supporters 
- [Veymax](https://x.com/veymax)
- [nebriv](https://github.com/nebriv)
- [Victor Butler](https://x.com/victor_butler)

