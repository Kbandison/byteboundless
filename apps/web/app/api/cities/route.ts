import { NextResponse } from "next/server";

// Comprehensive US cities list — top ~1500 cities by population
// Loaded lazily and cached in memory after first request
let CITIES: string[] | null = null;

async function loadCities(): Promise<string[]> {
  if (CITIES) return CITIES;

  // Use the free US cities API from simplemaps.com data
  // Fallback to a curated list if the fetch fails
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/grammakov/USA-cities-and-டates/master/us_cities_states_counties.csv",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const text = await res.text();
      const lines = text.split("\n").slice(1); // skip header
      const cities = new Set<string>();
      for (const line of lines) {
        const parts = line.split("|");
        if (parts.length >= 2) {
          const city = parts[0]?.trim();
          const state = parts[1]?.trim();
          if (city && state && state.length === 2) {
            cities.add(`${city}, ${state}`);
          }
        }
      }
      CITIES = [...cities].sort();
      return CITIES;
    }
  } catch { /* fallback below */ }

  // Fallback: curated list of top US cities
  CITIES = getDefaultCities();
  return CITIES;
}

function getDefaultCities(): string[] {
  const states: Record<string, string[]> = {
    AL: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],
    AK: ["Anchorage", "Fairbanks", "Juneau"],
    AZ: ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Chandler", "Gilbert", "Tempe", "Surprise", "Peoria"],
    AR: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale"],
    CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim", "Santa Ana", "Riverside", "Stockton", "Irvine", "Chula Vista", "Fremont", "Pasadena", "Burbank"],
    CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Boulder"],
    CT: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury"],
    DE: ["Wilmington", "Dover"],
    FL: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Fort Lauderdale", "Tallahassee", "Cape Coral", "Pembroke Pines", "Hollywood", "Gainesville", "Clearwater", "Coral Springs", "Palm Bay", "Lakeland", "Sarasota", "Naples"],
    GA: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Roswell", "Sandy Springs", "Johns Creek", "Alpharetta", "Marietta", "Kennesaw", "Duluth", "Lawrenceville", "Stonecrest", "Brookhaven", "Peachtree City", "Newnan", "Cartersville", "Dalton", "Valdosta", "Warner Robins", "Statesboro"],
    HI: ["Honolulu"],
    ID: ["Boise", "Meridian", "Nampa", "Idaho Falls"],
    IL: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Elgin", "Peoria"],
    IN: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers"],
    IA: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"],
    KS: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
    KY: ["Louisville", "Lexington", "Bowling Green"],
    LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
    ME: ["Portland", "Lewiston", "Bangor"],
    MD: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Annapolis"],
    MA: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],
    MI: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing"],
    MN: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington"],
    MS: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi"],
    MO: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"],
    MT: ["Billings", "Missoula", "Great Falls"],
    NE: ["Omaha", "Lincoln", "Bellevue"],
    NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
    NH: ["Manchester", "Nashua", "Concord"],
    NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton", "Clifton"],
    NM: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe"],
    NY: ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"],
    NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "Asheville"],
    ND: ["Fargo", "Bismarck", "Grand Forks"],
    OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
    OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond"],
    OR: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Bend"],
    PA: ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Erie", "Scranton"],
    RI: ["Providence", "Warwick", "Cranston"],
    SC: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Greenville", "Rock Hill"],
    SD: ["Sioux Falls", "Rapid City"],
    TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro"],
    TX: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo", "Lubbock", "Irving", "Garland", "Frisco", "McKinney", "Amarillo", "Grand Prairie", "Brownsville", "Killeen", "Pasadena", "McAllen", "Midland"],
    UT: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy"],
    VT: ["Burlington", "South Burlington"],
    VA: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Arlington", "Hampton", "Roanoke"],
    WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton"],
    WV: ["Charleston", "Huntington"],
    WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"],
    WY: ["Cheyenne", "Casper"],
    DC: ["Washington"],
  };

  const result: string[] = [];
  for (const [state, cities] of Object.entries(states)) {
    for (const city of cities) {
      result.push(`${city}, ${state}`);
    }
  }
  return result.sort();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";

  if (q.length < 2) {
    return NextResponse.json({ cities: [] });
  }

  const cities = await loadCities();
  const matches = cities
    .filter((c) => c.toLowerCase().includes(q))
    .slice(0, 10);

  return NextResponse.json({ cities: matches });
}
