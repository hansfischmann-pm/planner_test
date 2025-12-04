/**
 * DMA Database - Normalized structure for market data
 *
 * This module provides a relational-style data structure for:
 * - DMA (Designated Market Areas) - Nielsen's 210 markets
 * - TV Stations by DMA
 * - Radio Stations by DMA
 * - DOOH Inventory by DMA
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DMA {
    id: number;           // Nielsen DMA rank (1-210)
    name: string;         // Market name
    tvHouseholds: number; // Number of TV households
    percentUS: number;    // Percentage of US TV households
    state: string;        // Primary state
    aliases: string[];    // Alternative names/abbreviations
}

export interface TVStation {
    id: string;
    dmaId: number;
    callSign: string;
    network: 'ABC' | 'CBS' | 'NBC' | 'FOX' | 'CW' | 'PBS' | 'MyNetworkTV' | 'Telemundo' | 'Univision' | 'Independent';
    channel: number;
    subChannel?: string;  // e.g., "4.1"
    owner: string;
    isVirtual?: boolean;  // Virtual channel number
}

export interface RadioStation {
    id: string;
    dmaId: number;
    callSign: string;
    frequency: string;    // e.g., "102.7" or "880"
    band: 'FM' | 'AM';
    format: string;       // e.g., "Top 40", "News/Talk", "Country"
    owner: string;
    marketRank?: number;  // Rank within the market
}

export interface DOOHVenue {
    id: string;
    dmaId: number;
    name: string;
    venueType: 'Airport' | 'Transit' | 'Billboard' | 'Mall' | 'Gas Station' | 'Grocery' | 'Gym' | 'Office' | 'Restaurant' | 'Stadium' | 'Street Furniture';
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    screens: number;
    weeklyImpressions: number;
    operator: string;     // Clear Channel, Lamar, JCDecaux, etc.
}

// =============================================================================
// DMA MASTER DATA - All 210 Nielsen DMAs
// =============================================================================

export const DMA_LIST: DMA[] = [
    // Top 50 DMAs
    { id: 1, name: 'New York', tvHouseholds: 7452190, percentUS: 6.41, state: 'NY', aliases: ['NYC', 'New York City', 'NY'] },
    { id: 2, name: 'Los Angeles', tvHouseholds: 5684460, percentUS: 4.89, state: 'CA', aliases: ['LA', 'L.A.', 'Southern California'] },
    { id: 3, name: 'Chicago', tvHouseholds: 3479270, percentUS: 2.99, state: 'IL', aliases: ['Chi', 'Chicagoland'] },
    { id: 4, name: 'Philadelphia', tvHouseholds: 2970380, percentUS: 2.55, state: 'PA', aliases: ['Philly', 'Philadelphia-Wilmington'] },
    { id: 5, name: 'Dallas-Ft. Worth', tvHouseholds: 2954630, percentUS: 2.54, state: 'TX', aliases: ['DFW', 'Dallas', 'Fort Worth'] },
    { id: 6, name: 'San Francisco-Oakland-San Jose', tvHouseholds: 2607890, percentUS: 2.24, state: 'CA', aliases: ['SF', 'Bay Area', 'San Francisco'] },
    { id: 7, name: 'Atlanta', tvHouseholds: 2559540, percentUS: 2.20, state: 'GA', aliases: ['ATL'] },
    { id: 8, name: 'Houston', tvHouseholds: 2534800, percentUS: 2.18, state: 'TX', aliases: ['HOU'] },
    { id: 9, name: 'Washington, DC', tvHouseholds: 2509200, percentUS: 2.16, state: 'DC', aliases: ['DC', 'DMV', 'Washington'] },
    { id: 10, name: 'Boston', tvHouseholds: 2449110, percentUS: 2.11, state: 'MA', aliases: ['BOS'] },
    { id: 11, name: 'Phoenix', tvHouseholds: 2044410, percentUS: 1.76, state: 'AZ', aliases: ['PHX'] },
    { id: 12, name: 'Seattle-Tacoma', tvHouseholds: 2017990, percentUS: 1.74, state: 'WA', aliases: ['Seattle', 'SEA'] },
    { id: 13, name: 'Tampa-St. Petersburg', tvHouseholds: 1998590, percentUS: 1.72, state: 'FL', aliases: ['Tampa', 'Tampa Bay'] },
    { id: 14, name: 'Minneapolis-St. Paul', tvHouseholds: 1897790, percentUS: 1.63, state: 'MN', aliases: ['Minneapolis', 'Twin Cities', 'MSP'] },
    { id: 15, name: 'Denver', tvHouseholds: 1797440, percentUS: 1.55, state: 'CO', aliases: ['DEN'] },
    { id: 16, name: 'Orlando-Daytona Beach', tvHouseholds: 1793950, percentUS: 1.54, state: 'FL', aliases: ['Orlando', 'MCO'] },
    { id: 17, name: 'Miami-Ft. Lauderdale', tvHouseholds: 1759730, percentUS: 1.51, state: 'FL', aliases: ['Miami', 'MIA', 'South Florida'] },
    { id: 18, name: 'Cleveland-Akron', tvHouseholds: 1513640, percentUS: 1.30, state: 'OH', aliases: ['Cleveland', 'CLE'] },
    { id: 19, name: 'Sacramento-Stockton', tvHouseholds: 1489880, percentUS: 1.28, state: 'CA', aliases: ['Sacramento', 'SAC'] },
    { id: 20, name: 'St. Louis', tvHouseholds: 1252010, percentUS: 1.08, state: 'MO', aliases: ['STL'] },
    { id: 21, name: 'Portland, OR', tvHouseholds: 1241360, percentUS: 1.07, state: 'OR', aliases: ['Portland', 'PDX'] },
    { id: 22, name: 'Charlotte', tvHouseholds: 1223760, percentUS: 1.05, state: 'NC', aliases: ['CLT'] },
    { id: 23, name: 'Pittsburgh', tvHouseholds: 1168230, percentUS: 1.01, state: 'PA', aliases: ['PIT'] },
    { id: 24, name: 'Raleigh-Durham', tvHouseholds: 1165790, percentUS: 1.00, state: 'NC', aliases: ['Raleigh', 'RDU', 'Triangle'] },
    { id: 25, name: 'Indianapolis', tvHouseholds: 1138720, percentUS: 0.98, state: 'IN', aliases: ['Indy', 'IND'] },
    { id: 26, name: 'Baltimore', tvHouseholds: 1125840, percentUS: 0.97, state: 'MD', aliases: ['BAL'] },
    { id: 27, name: 'Nashville', tvHouseholds: 1111340, percentUS: 0.96, state: 'TN', aliases: ['BNA'] },
    { id: 28, name: 'San Diego', tvHouseholds: 1092310, percentUS: 0.94, state: 'CA', aliases: ['SD'] },
    { id: 29, name: 'Hartford-New Haven', tvHouseholds: 1039630, percentUS: 0.89, state: 'CT', aliases: ['Hartford', 'New Haven'] },
    { id: 30, name: 'Salt Lake City', tvHouseholds: 1013730, percentUS: 0.87, state: 'UT', aliases: ['SLC'] },
    { id: 31, name: 'Columbus, OH', tvHouseholds: 989140, percentUS: 0.85, state: 'OH', aliases: ['Columbus', 'CMH'] },
    { id: 32, name: 'Kansas City', tvHouseholds: 981590, percentUS: 0.84, state: 'MO', aliases: ['KC', 'MCI'] },
    { id: 33, name: 'Milwaukee', tvHouseholds: 930920, percentUS: 0.80, state: 'WI', aliases: ['MKE'] },
    { id: 34, name: 'Cincinnati', tvHouseholds: 912190, percentUS: 0.78, state: 'OH', aliases: ['CVG'] },
    { id: 35, name: 'San Antonio', tvHouseholds: 901640, percentUS: 0.78, state: 'TX', aliases: ['SAT'] },
    { id: 36, name: 'Austin', tvHouseholds: 899690, percentUS: 0.77, state: 'TX', aliases: ['AUS'] },
    { id: 37, name: 'Las Vegas', tvHouseholds: 858930, percentUS: 0.74, state: 'NV', aliases: ['LAS'] },
    { id: 38, name: 'Greenville-Spartanburg', tvHouseholds: 847310, percentUS: 0.73, state: 'SC', aliases: ['Greenville', 'GSP'] },
    { id: 39, name: 'Grand Rapids-Kalamazoo', tvHouseholds: 788850, percentUS: 0.68, state: 'MI', aliases: ['Grand Rapids', 'GRR'] },
    { id: 40, name: 'Oklahoma City', tvHouseholds: 763450, percentUS: 0.66, state: 'OK', aliases: ['OKC'] },
    { id: 41, name: 'Birmingham', tvHouseholds: 747400, percentUS: 0.64, state: 'AL', aliases: ['BHM'] },
    { id: 42, name: 'Harrisburg-Lancaster-Lebanon-York', tvHouseholds: 739760, percentUS: 0.64, state: 'PA', aliases: ['Harrisburg', 'MDT'] },
    { id: 43, name: 'Norfolk-Portsmouth-Newport News', tvHouseholds: 735430, percentUS: 0.63, state: 'VA', aliases: ['Norfolk', 'Hampton Roads', 'ORF'] },
    { id: 44, name: 'Greensboro-High Point-Winston Salem', tvHouseholds: 721640, percentUS: 0.62, state: 'NC', aliases: ['Greensboro', 'GSO'] },
    { id: 45, name: 'Jacksonville', tvHouseholds: 720520, percentUS: 0.62, state: 'FL', aliases: ['JAX'] },
    { id: 46, name: 'Albuquerque-Santa Fe', tvHouseholds: 719090, percentUS: 0.62, state: 'NM', aliases: ['Albuquerque', 'ABQ'] },
    { id: 47, name: 'Louisville', tvHouseholds: 703240, percentUS: 0.60, state: 'KY', aliases: ['SDF'] },
    { id: 48, name: 'Memphis', tvHouseholds: 682540, percentUS: 0.59, state: 'TN', aliases: ['MEM'] },
    { id: 49, name: 'New Orleans', tvHouseholds: 654250, percentUS: 0.56, state: 'LA', aliases: ['NOLA', 'MSY'] },
    { id: 50, name: 'West Palm Beach-Ft. Pierce', tvHouseholds: 651320, percentUS: 0.56, state: 'FL', aliases: ['West Palm Beach', 'PBI'] },

    // DMAs 51-100
    { id: 51, name: 'Providence-New Bedford', tvHouseholds: 647980, percentUS: 0.56, state: 'RI', aliases: ['Providence', 'PVD'] },
    { id: 52, name: 'Buffalo', tvHouseholds: 637500, percentUS: 0.55, state: 'NY', aliases: ['BUF'] },
    { id: 53, name: 'Fresno-Visalia', tvHouseholds: 606730, percentUS: 0.52, state: 'CA', aliases: ['Fresno', 'FAT'] },
    { id: 54, name: 'Richmond-Petersburg', tvHouseholds: 576840, percentUS: 0.50, state: 'VA', aliases: ['Richmond', 'RIC'] },
    { id: 55, name: 'Wilkes Barre-Scranton-Hazleton', tvHouseholds: 563560, percentUS: 0.48, state: 'PA', aliases: ['Scranton', 'Wilkes-Barre', 'AVP'] },
    { id: 56, name: 'Little Rock-Pine Bluff', tvHouseholds: 552100, percentUS: 0.47, state: 'AR', aliases: ['Little Rock', 'LIT'] },
    { id: 57, name: 'Albany-Schenectady-Troy', tvHouseholds: 545000, percentUS: 0.47, state: 'NY', aliases: ['Albany', 'ALB'] },
    { id: 58, name: 'Knoxville', tvHouseholds: 543810, percentUS: 0.47, state: 'TN', aliases: ['TYS'] },
    { id: 59, name: 'Tulsa', tvHouseholds: 543140, percentUS: 0.47, state: 'OK', aliases: ['TUL'] },
    { id: 60, name: 'Lexington', tvHouseholds: 519810, percentUS: 0.45, state: 'KY', aliases: ['LEX'] },
    { id: 61, name: 'Dayton', tvHouseholds: 518980, percentUS: 0.45, state: 'OH', aliases: ['DAY'] },
    { id: 62, name: 'Tucson-Sierra Vista', tvHouseholds: 502770, percentUS: 0.43, state: 'AZ', aliases: ['Tucson', 'TUS'] },
    { id: 63, name: 'Honolulu', tvHouseholds: 489610, percentUS: 0.42, state: 'HI', aliases: ['HNL'] },
    { id: 64, name: 'Spokane', tvHouseholds: 479790, percentUS: 0.41, state: 'WA', aliases: ['GEG'] },
    { id: 65, name: 'Rochester, NY', tvHouseholds: 473950, percentUS: 0.41, state: 'NY', aliases: ['Rochester', 'ROC'] },
    { id: 66, name: 'Des Moines-Ames', tvHouseholds: 459200, percentUS: 0.40, state: 'IA', aliases: ['Des Moines', 'DSM'] },
    { id: 67, name: 'Omaha', tvHouseholds: 453890, percentUS: 0.39, state: 'NE', aliases: ['OMA'] },
    { id: 68, name: 'Flint-Saginaw-Bay City', tvHouseholds: 448900, percentUS: 0.39, state: 'MI', aliases: ['Flint', 'FNT'] },
    { id: 69, name: 'Springfield, MO', tvHouseholds: 447360, percentUS: 0.38, state: 'MO', aliases: ['Springfield MO', 'SGF'] },
    { id: 70, name: 'Paducah-Cape Girardeau-Harrisburg', tvHouseholds: 438950, percentUS: 0.38, state: 'KY', aliases: ['Paducah', 'PAH'] },
    { id: 71, name: 'Columbia, SC', tvHouseholds: 429720, percentUS: 0.37, state: 'SC', aliases: ['Columbia SC', 'CAE'] },
    { id: 72, name: 'Shreveport', tvHouseholds: 427890, percentUS: 0.37, state: 'LA', aliases: ['SHV'] },
    { id: 73, name: 'Madison', tvHouseholds: 421290, percentUS: 0.36, state: 'WI', aliases: ['MSN'] },
    { id: 74, name: 'Chattanooga', tvHouseholds: 414620, percentUS: 0.36, state: 'TN', aliases: ['CHA'] },
    { id: 75, name: 'Wichita-Hutchinson', tvHouseholds: 406970, percentUS: 0.35, state: 'KS', aliases: ['Wichita', 'ICT'] },
    { id: 76, name: 'Mobile-Pensacola', tvHouseholds: 403540, percentUS: 0.35, state: 'AL', aliases: ['Mobile', 'MOB'] },
    { id: 77, name: 'Huntsville-Decatur-Florence', tvHouseholds: 398830, percentUS: 0.34, state: 'AL', aliases: ['Huntsville', 'HSV'] },
    { id: 78, name: 'El Paso', tvHouseholds: 387720, percentUS: 0.33, state: 'TX', aliases: ['ELP'] },
    { id: 79, name: 'Toledo', tvHouseholds: 385140, percentUS: 0.33, state: 'OH', aliases: ['TOL'] },
    { id: 80, name: 'Syracuse', tvHouseholds: 380010, percentUS: 0.33, state: 'NY', aliases: ['SYR'] },
    { id: 81, name: 'Waco-Temple-Bryan', tvHouseholds: 377790, percentUS: 0.32, state: 'TX', aliases: ['Waco', 'ACT'] },
    { id: 82, name: 'Green Bay-Appleton', tvHouseholds: 375880, percentUS: 0.32, state: 'WI', aliases: ['Green Bay', 'GRB'] },
    { id: 83, name: 'Colorado Springs-Pueblo', tvHouseholds: 375450, percentUS: 0.32, state: 'CO', aliases: ['Colorado Springs', 'COS'] },
    { id: 84, name: 'Davenport-Rock Island-Moline', tvHouseholds: 373980, percentUS: 0.32, state: 'IA', aliases: ['Quad Cities', 'MLI'] },
    { id: 85, name: 'Cedar Rapids-Waterloo-Iowa City-Dubuque', tvHouseholds: 370870, percentUS: 0.32, state: 'IA', aliases: ['Cedar Rapids', 'CID'] },
    { id: 86, name: 'Baton Rouge', tvHouseholds: 367100, percentUS: 0.32, state: 'LA', aliases: ['BTR'] },
    { id: 87, name: 'Jackson, MS', tvHouseholds: 365910, percentUS: 0.31, state: 'MS', aliases: ['Jackson MS', 'JAN'] },
    { id: 88, name: 'Savannah', tvHouseholds: 365560, percentUS: 0.31, state: 'GA', aliases: ['SAV'] },
    { id: 89, name: 'Charleston, SC', tvHouseholds: 362290, percentUS: 0.31, state: 'SC', aliases: ['Charleston SC', 'CHS'] },
    { id: 90, name: 'Burlington-Plattsburgh', tvHouseholds: 359820, percentUS: 0.31, state: 'VT', aliases: ['Burlington', 'BTV'] },
    { id: 91, name: 'Harlingen-Weslaco-Brownsville-McAllen', tvHouseholds: 358700, percentUS: 0.31, state: 'TX', aliases: ['McAllen', 'Rio Grande Valley', 'MFE'] },
    { id: 92, name: 'Tri-Cities, TN-VA', tvHouseholds: 354470, percentUS: 0.30, state: 'TN', aliases: ['Tri-Cities', 'TRI'] },
    { id: 93, name: 'South Bend-Elkhart', tvHouseholds: 348310, percentUS: 0.30, state: 'IN', aliases: ['South Bend', 'SBN'] },
    { id: 94, name: 'Evansville', tvHouseholds: 338570, percentUS: 0.29, state: 'IN', aliases: ['EVV'] },
    { id: 95, name: 'Ft. Wayne', tvHouseholds: 333650, percentUS: 0.29, state: 'IN', aliases: ['Fort Wayne', 'FWA'] },
    { id: 96, name: 'Myrtle Beach-Florence', tvHouseholds: 332900, percentUS: 0.29, state: 'SC', aliases: ['Myrtle Beach', 'MYR'] },
    { id: 97, name: 'Johnstown-Altoona-State College', tvHouseholds: 327270, percentUS: 0.28, state: 'PA', aliases: ['Altoona', 'AOO'] },
    { id: 98, name: 'Roanoke-Lynchburg', tvHouseholds: 325950, percentUS: 0.28, state: 'VA', aliases: ['Roanoke', 'ROA'] },
    { id: 99, name: 'Boise', tvHouseholds: 323320, percentUS: 0.28, state: 'ID', aliases: ['BOI'] },
    { id: 100, name: 'Youngstown', tvHouseholds: 322010, percentUS: 0.28, state: 'OH', aliases: ['YNG'] },

    // DMAs 101-150
    { id: 101, name: 'Lincoln-Hastings-Kearney', tvHouseholds: 320860, percentUS: 0.28, state: 'NE', aliases: ['Lincoln', 'LNK'] },
    { id: 102, name: 'Tyler-Longview', tvHouseholds: 317920, percentUS: 0.27, state: 'TX', aliases: ['Tyler', 'TYR'] },
    { id: 103, name: 'Springfield-Holyoke', tvHouseholds: 314220, percentUS: 0.27, state: 'MA', aliases: ['Springfield MA'] },
    { id: 104, name: 'Sioux Falls-Mitchell', tvHouseholds: 307830, percentUS: 0.26, state: 'SD', aliases: ['Sioux Falls', 'FSD'] },
    { id: 105, name: 'Ft. Myers-Naples', tvHouseholds: 307010, percentUS: 0.26, state: 'FL', aliases: ['Fort Myers', 'RSW'] },
    { id: 106, name: 'Augusta-Aiken', tvHouseholds: 304180, percentUS: 0.26, state: 'GA', aliases: ['Augusta', 'AGS'] },
    { id: 107, name: 'Lansing', tvHouseholds: 300760, percentUS: 0.26, state: 'MI', aliases: ['LAN'] },
    { id: 108, name: 'Fargo-Valley City', tvHouseholds: 295210, percentUS: 0.25, state: 'ND', aliases: ['Fargo', 'FAR'] },
    { id: 109, name: 'Tallahassee-Thomasville', tvHouseholds: 291910, percentUS: 0.25, state: 'FL', aliases: ['Tallahassee', 'TLH'] },
    { id: 110, name: 'Traverse City-Cadillac', tvHouseholds: 290380, percentUS: 0.25, state: 'MI', aliases: ['Traverse City', 'TVC'] },
    { id: 111, name: 'Montgomery-Selma', tvHouseholds: 284690, percentUS: 0.24, state: 'AL', aliases: ['Montgomery', 'MGM'] },
    { id: 112, name: 'Peoria-Bloomington', tvHouseholds: 279160, percentUS: 0.24, state: 'IL', aliases: ['Peoria', 'PIA'] },
    { id: 113, name: 'Eugene', tvHouseholds: 275990, percentUS: 0.24, state: 'OR', aliases: ['EUG'] },
    { id: 114, name: 'Santa Barbara-Santa Maria-San Luis Obispo', tvHouseholds: 271200, percentUS: 0.23, state: 'CA', aliases: ['Santa Barbara', 'SBA'] },
    { id: 115, name: 'Macon', tvHouseholds: 270670, percentUS: 0.23, state: 'GA', aliases: ['MCN'] },
    { id: 116, name: 'Lafayette, LA', tvHouseholds: 265940, percentUS: 0.23, state: 'LA', aliases: ['Lafayette LA', 'LFT'] },
    { id: 117, name: 'Bakersfield', tvHouseholds: 265300, percentUS: 0.23, state: 'CA', aliases: ['BFL'] },
    { id: 118, name: 'Yakima-Pasco-Richland-Kennewick', tvHouseholds: 264260, percentUS: 0.23, state: 'WA', aliases: ['Yakima', 'YKM'] },
    { id: 119, name: 'Monterey-Salinas', tvHouseholds: 262680, percentUS: 0.23, state: 'CA', aliases: ['Monterey', 'MRY'] },
    { id: 120, name: 'Columbus, GA', tvHouseholds: 259940, percentUS: 0.22, state: 'GA', aliases: ['Columbus GA', 'CSG'] },
    { id: 121, name: 'La Crosse-Eau Claire', tvHouseholds: 254550, percentUS: 0.22, state: 'WI', aliases: ['La Crosse', 'LSE'] },
    { id: 122, name: 'Corpus Christi', tvHouseholds: 247470, percentUS: 0.21, state: 'TX', aliases: ['CRP'] },
    { id: 123, name: 'Amarillo', tvHouseholds: 245740, percentUS: 0.21, state: 'TX', aliases: ['AMA'] },
    { id: 124, name: 'Rockford', tvHouseholds: 241700, percentUS: 0.21, state: 'IL', aliases: ['RFD'] },
    { id: 125, name: 'Chico-Redding', tvHouseholds: 240220, percentUS: 0.21, state: 'CA', aliases: ['Chico', 'RDD'] },
    { id: 126, name: 'Duluth-Superior', tvHouseholds: 237850, percentUS: 0.20, state: 'MN', aliases: ['Duluth', 'DLH'] },
    { id: 127, name: 'Wausau-Rhinelander', tvHouseholds: 234700, percentUS: 0.20, state: 'WI', aliases: ['Wausau', 'CWA'] },
    { id: 128, name: 'Topeka', tvHouseholds: 232680, percentUS: 0.20, state: 'KS', aliases: ['TOP'] },
    { id: 129, name: 'Columbus-Tupelo-West Point', tvHouseholds: 230480, percentUS: 0.20, state: 'MS', aliases: ['Tupelo', 'GTR'] },
    { id: 130, name: 'Medford-Klamath Falls', tvHouseholds: 224790, percentUS: 0.19, state: 'OR', aliases: ['Medford', 'MFR'] },
    { id: 131, name: 'Beaumont-Port Arthur', tvHouseholds: 221180, percentUS: 0.19, state: 'TX', aliases: ['Beaumont', 'BPT'] },
    { id: 132, name: 'Erie', tvHouseholds: 219450, percentUS: 0.19, state: 'PA', aliases: ['ERI'] },
    { id: 133, name: 'Columbia-Jefferson City', tvHouseholds: 216810, percentUS: 0.19, state: 'MO', aliases: ['Columbia MO', 'COU'] },
    { id: 134, name: 'Joplin-Pittsburg', tvHouseholds: 215730, percentUS: 0.19, state: 'MO', aliases: ['Joplin', 'JLN'] },
    { id: 135, name: 'Bluefield-Beckley-Oak Hill', tvHouseholds: 214720, percentUS: 0.18, state: 'WV', aliases: ['Bluefield', 'BLF'] },
    { id: 136, name: 'Wilmington', tvHouseholds: 212700, percentUS: 0.18, state: 'NC', aliases: ['ILM'] },
    { id: 137, name: 'Albany, GA', tvHouseholds: 211520, percentUS: 0.18, state: 'GA', aliases: ['Albany GA', 'ABY'] },
    { id: 138, name: 'Rochester-Mason City-Austin', tvHouseholds: 210870, percentUS: 0.18, state: 'MN', aliases: ['Rochester MN', 'RST'] },
    { id: 139, name: 'Palm Springs', tvHouseholds: 207970, percentUS: 0.18, state: 'CA', aliases: ['PSP'] },
    { id: 140, name: 'Terre Haute', tvHouseholds: 206970, percentUS: 0.18, state: 'IN', aliases: ['HUF'] },
    { id: 141, name: 'Salisbury', tvHouseholds: 205740, percentUS: 0.18, state: 'MD', aliases: ['SBY'] },
    { id: 142, name: 'Odessa-Midland', tvHouseholds: 204700, percentUS: 0.18, state: 'TX', aliases: ['Midland', 'MAF'] },
    { id: 143, name: 'Wheeling-Steubenville', tvHouseholds: 199280, percentUS: 0.17, state: 'WV', aliases: ['Wheeling', 'HLG'] },
    { id: 144, name: 'Panama City', tvHouseholds: 198020, percentUS: 0.17, state: 'FL', aliases: ['ECP'] },
    { id: 145, name: 'Bangor', tvHouseholds: 197750, percentUS: 0.17, state: 'ME', aliases: ['BGR'] },
    { id: 146, name: 'Biloxi-Gulfport', tvHouseholds: 193630, percentUS: 0.17, state: 'MS', aliases: ['Biloxi', 'GPT'] },
    { id: 147, name: 'Gainesville', tvHouseholds: 192360, percentUS: 0.17, state: 'FL', aliases: ['GNV'] },
    { id: 148, name: 'Minot-Bismarck-Dickinson', tvHouseholds: 191420, percentUS: 0.16, state: 'ND', aliases: ['Bismarck', 'BIS'] },
    { id: 149, name: 'Anchorage', tvHouseholds: 188910, percentUS: 0.16, state: 'AK', aliases: ['ANC'] },
    { id: 150, name: 'Sherman-Ada', tvHouseholds: 188310, percentUS: 0.16, state: 'TX', aliases: ['Sherman'] },

    // DMAs 151-210
    { id: 151, name: 'Idaho Falls-Pocatello', tvHouseholds: 186430, percentUS: 0.16, state: 'ID', aliases: ['Idaho Falls', 'IDA'] },
    { id: 152, name: 'Clarksburg-Weston', tvHouseholds: 181820, percentUS: 0.16, state: 'WV', aliases: ['Clarksburg', 'CKB'] },
    { id: 153, name: 'Abilene-Sweetwater', tvHouseholds: 177840, percentUS: 0.15, state: 'TX', aliases: ['Abilene', 'ABI'] },
    { id: 154, name: 'Utica', tvHouseholds: 175300, percentUS: 0.15, state: 'NY', aliases: ['UCA'] },
    { id: 155, name: 'Hattiesburg-Laurel', tvHouseholds: 170020, percentUS: 0.15, state: 'MS', aliases: ['Hattiesburg', 'PIB'] },
    { id: 156, name: 'Quincy-Hannibal-Keokuk', tvHouseholds: 167020, percentUS: 0.14, state: 'IL', aliases: ['Quincy', 'UIN'] },
    { id: 157, name: 'Missoula', tvHouseholds: 164420, percentUS: 0.14, state: 'MT', aliases: ['MSO'] },
    { id: 158, name: 'Billings', tvHouseholds: 162720, percentUS: 0.14, state: 'MT', aliases: ['BIL'] },
    { id: 159, name: 'Dothan', tvHouseholds: 159120, percentUS: 0.14, state: 'AL', aliases: ['DHN'] },
    { id: 160, name: 'Yuma-El Centro', tvHouseholds: 157900, percentUS: 0.14, state: 'AZ', aliases: ['Yuma', 'YUM'] },
    { id: 161, name: 'Rapid City', tvHouseholds: 155640, percentUS: 0.13, state: 'SD', aliases: ['RAP'] },
    { id: 162, name: 'Lake Charles', tvHouseholds: 153780, percentUS: 0.13, state: 'LA', aliases: ['LCH'] },
    { id: 163, name: 'Jackson, TN', tvHouseholds: 150370, percentUS: 0.13, state: 'TN', aliases: ['Jackson TN', 'MKL'] },
    { id: 164, name: 'Marquette', tvHouseholds: 147650, percentUS: 0.13, state: 'MI', aliases: ['MQT'] },
    { id: 165, name: 'Jonesboro', tvHouseholds: 146310, percentUS: 0.13, state: 'AR', aliases: ['JBR'] },
    { id: 166, name: 'Bowling Green', tvHouseholds: 142990, percentUS: 0.12, state: 'KY', aliases: ['BWG'] },
    { id: 167, name: 'Laredo', tvHouseholds: 141200, percentUS: 0.12, state: 'TX', aliases: ['LRD'] },
    { id: 168, name: 'Charlottesville', tvHouseholds: 138740, percentUS: 0.12, state: 'VA', aliases: ['CHO'] },
    { id: 169, name: 'Elmira-Corning', tvHouseholds: 137100, percentUS: 0.12, state: 'NY', aliases: ['Elmira', 'ELM'] },
    { id: 170, name: 'Alexandria, LA', tvHouseholds: 136750, percentUS: 0.12, state: 'LA', aliases: ['Alexandria LA', 'AEX'] },
    { id: 171, name: 'Great Falls', tvHouseholds: 135580, percentUS: 0.12, state: 'MT', aliases: ['GTF'] },
    { id: 172, name: 'Greenwood-Greenville', tvHouseholds: 133750, percentUS: 0.12, state: 'MS', aliases: ['Greenwood', 'GWO'] },
    { id: 173, name: 'Watertown', tvHouseholds: 132270, percentUS: 0.11, state: 'NY', aliases: ['ART'] },
    { id: 174, name: 'Meridian', tvHouseholds: 129850, percentUS: 0.11, state: 'MS', aliases: ['MEI'] },
    { id: 175, name: 'Lubbock', tvHouseholds: 128470, percentUS: 0.11, state: 'TX', aliases: ['LBB'] },
    { id: 176, name: 'Butte-Bozeman', tvHouseholds: 126490, percentUS: 0.11, state: 'MT', aliases: ['Butte', 'BTM'] },
    { id: 177, name: 'Harrisonburg', tvHouseholds: 124240, percentUS: 0.11, state: 'VA', aliases: ['SHD'] },
    { id: 178, name: 'Wichita Falls-Lawton', tvHouseholds: 121360, percentUS: 0.10, state: 'TX', aliases: ['Wichita Falls', 'SPS'] },
    { id: 179, name: 'Parkersburg', tvHouseholds: 119560, percentUS: 0.10, state: 'WV', aliases: ['PKB'] },
    { id: 180, name: 'Lafayette, IN', tvHouseholds: 117890, percentUS: 0.10, state: 'IN', aliases: ['Lafayette IN', 'LAF'] },
    { id: 181, name: 'Eureka', tvHouseholds: 117160, percentUS: 0.10, state: 'CA', aliases: ['ACV'] },
    { id: 182, name: 'Grand Junction-Montrose', tvHouseholds: 115710, percentUS: 0.10, state: 'CO', aliases: ['Grand Junction', 'GJT'] },
    { id: 183, name: 'San Angelo', tvHouseholds: 114740, percentUS: 0.10, state: 'TX', aliases: ['SJT'] },
    { id: 184, name: 'Sioux City', tvHouseholds: 113490, percentUS: 0.10, state: 'IA', aliases: ['SUX'] },
    { id: 185, name: 'Casper-Riverton', tvHouseholds: 111200, percentUS: 0.10, state: 'WY', aliases: ['Casper', 'CPR'] },
    { id: 186, name: 'Cheyenne-Scottsbluff', tvHouseholds: 108410, percentUS: 0.09, state: 'WY', aliases: ['Cheyenne', 'CYS'] },
    { id: 187, name: 'Monroe-El Dorado', tvHouseholds: 107200, percentUS: 0.09, state: 'LA', aliases: ['Monroe', 'MLU'] },
    { id: 188, name: 'Bend, OR', tvHouseholds: 106270, percentUS: 0.09, state: 'OR', aliases: ['Bend', 'RDM'] },
    { id: 189, name: 'Ottumwa-Kirksville', tvHouseholds: 104780, percentUS: 0.09, state: 'IA', aliases: ['Ottumwa', 'OTM'] },
    { id: 190, name: 'St. Joseph', tvHouseholds: 101990, percentUS: 0.09, state: 'MO', aliases: ['STJ'] },
    { id: 191, name: 'Lima', tvHouseholds: 99260, percentUS: 0.09, state: 'OH', aliases: ['LCK'] },
    { id: 192, name: 'Mankato', tvHouseholds: 97870, percentUS: 0.08, state: 'MN', aliases: ['MKT'] },
    { id: 193, name: 'Fairbanks', tvHouseholds: 95220, percentUS: 0.08, state: 'AK', aliases: ['FAI'] },
    { id: 194, name: 'Zanesville', tvHouseholds: 91570, percentUS: 0.08, state: 'OH', aliases: ['ZZV'] },
    { id: 195, name: 'Presque Isle', tvHouseholds: 87290, percentUS: 0.08, state: 'ME', aliases: ['PQI'] },
    { id: 196, name: 'Victoria', tvHouseholds: 84530, percentUS: 0.07, state: 'TX', aliases: ['VCT'] },
    { id: 197, name: 'Twin Falls', tvHouseholds: 82680, percentUS: 0.07, state: 'ID', aliases: ['TWF'] },
    { id: 198, name: 'Helena', tvHouseholds: 78390, percentUS: 0.07, state: 'MT', aliases: ['HLN'] },
    { id: 199, name: 'Juneau', tvHouseholds: 75280, percentUS: 0.06, state: 'AK', aliases: ['JNU'] },
    { id: 200, name: 'Alpena', tvHouseholds: 54710, percentUS: 0.05, state: 'MI', aliases: ['APN'] },
    { id: 201, name: 'North Platte', tvHouseholds: 52180, percentUS: 0.04, state: 'NE', aliases: ['LBF'] },
    { id: 202, name: 'Glendive', tvHouseholds: 19740, percentUS: 0.02, state: 'MT', aliases: ['GDV'] },

    // Additional markets to complete 210
    { id: 203, name: 'Flagstaff-Prescott', tvHouseholds: 180000, percentUS: 0.15, state: 'AZ', aliases: ['Flagstaff', 'FLG'] },
    { id: 204, name: 'Bowling Green-Glasgow', tvHouseholds: 140000, percentUS: 0.12, state: 'KY', aliases: ['Glasgow'] },
    { id: 205, name: 'Panama City-Marianna', tvHouseholds: 195000, percentUS: 0.17, state: 'FL', aliases: ['Marianna'] },
    { id: 206, name: 'Greenville-New Bern', tvHouseholds: 340000, percentUS: 0.29, state: 'NC', aliases: ['New Bern', 'EWN'] },
    { id: 207, name: 'Champaign-Springfield-Decatur', tvHouseholds: 380000, percentUS: 0.33, state: 'IL', aliases: ['Champaign', 'CMI'] },
    { id: 208, name: 'Ft. Smith-Fayetteville-Rogers', tvHouseholds: 370000, percentUS: 0.32, state: 'AR', aliases: ['Fayetteville AR', 'XNA'] },
    { id: 209, name: 'Reno', tvHouseholds: 335000, percentUS: 0.29, state: 'NV', aliases: ['RNO'] },
    { id: 210, name: 'Tucson', tvHouseholds: 495000, percentUS: 0.43, state: 'AZ', aliases: ['TUC'] },
];

// =============================================================================
// TV STATIONS BY DMA
// =============================================================================

export const TV_STATIONS: TVStation[] = [
    // DMA 1 - New York
    { id: 'wabc', dmaId: 1, callSign: 'WABC-TV', network: 'ABC', channel: 7, owner: 'Disney' },
    { id: 'wcbs', dmaId: 1, callSign: 'WCBS-TV', network: 'CBS', channel: 2, owner: 'Paramount Global' },
    { id: 'wnbc', dmaId: 1, callSign: 'WNBC', network: 'NBC', channel: 4, owner: 'NBCUniversal' },
    { id: 'wnyw', dmaId: 1, callSign: 'WNYW', network: 'FOX', channel: 5, owner: 'Fox Corporation' },
    { id: 'wpix', dmaId: 1, callSign: 'WPIX', network: 'CW', channel: 11, owner: 'Nexstar Media Group' },
    { id: 'wnet', dmaId: 1, callSign: 'WNET', network: 'PBS', channel: 13, owner: 'WNET' },
    { id: 'wwor', dmaId: 1, callSign: 'WWOR-TV', network: 'MyNetworkTV', channel: 9, owner: 'Fox Corporation' },
    { id: 'wnju', dmaId: 1, callSign: 'WNJU', network: 'Telemundo', channel: 47, owner: 'NBCUniversal' },
    { id: 'wxtv', dmaId: 1, callSign: 'WXTV-DT', network: 'Univision', channel: 41, owner: 'Univision' },

    // DMA 2 - Los Angeles
    { id: 'kabc', dmaId: 2, callSign: 'KABC-TV', network: 'ABC', channel: 7, owner: 'Disney' },
    { id: 'kcbs', dmaId: 2, callSign: 'KCBS-TV', network: 'CBS', channel: 2, owner: 'Paramount Global' },
    { id: 'knbc', dmaId: 2, callSign: 'KNBC', network: 'NBC', channel: 4, owner: 'NBCUniversal' },
    { id: 'kttv', dmaId: 2, callSign: 'KTTV', network: 'FOX', channel: 11, owner: 'Fox Corporation' },
    { id: 'ktla', dmaId: 2, callSign: 'KTLA', network: 'CW', channel: 5, owner: 'Nexstar Media Group' },
    { id: 'kcet', dmaId: 2, callSign: 'KCET', network: 'PBS', channel: 28, owner: 'KCET' },
    { id: 'kcop', dmaId: 2, callSign: 'KCOP-TV', network: 'MyNetworkTV', channel: 13, owner: 'Fox Corporation' },
    { id: 'kvea', dmaId: 2, callSign: 'KVEA', network: 'Telemundo', channel: 52, owner: 'NBCUniversal' },
    { id: 'kmex', dmaId: 2, callSign: 'KMEX-DT', network: 'Univision', channel: 34, owner: 'Univision' },

    // DMA 3 - Chicago
    { id: 'wls', dmaId: 3, callSign: 'WLS-TV', network: 'ABC', channel: 7, owner: 'Disney' },
    { id: 'wbbm', dmaId: 3, callSign: 'WBBM-TV', network: 'CBS', channel: 2, owner: 'Paramount Global' },
    { id: 'wmaq', dmaId: 3, callSign: 'WMAQ-TV', network: 'NBC', channel: 5, owner: 'NBCUniversal' },
    { id: 'wfld', dmaId: 3, callSign: 'WFLD', network: 'FOX', channel: 32, owner: 'Fox Corporation' },
    { id: 'wgn', dmaId: 3, callSign: 'WGN-TV', network: 'Independent', channel: 9, owner: 'Nexstar Media Group' },
    { id: 'wpwr', dmaId: 3, callSign: 'WPWR-TV', network: 'CW', channel: 50, owner: 'Fox Corporation' },
    { id: 'wttw', dmaId: 3, callSign: 'WTTW', network: 'PBS', channel: 11, owner: 'WTTW' },
    { id: 'wsns', dmaId: 3, callSign: 'WSNS-TV', network: 'Telemundo', channel: 44, owner: 'NBCUniversal' },
    { id: 'wgbo', dmaId: 3, callSign: 'WGBO-DT', network: 'Univision', channel: 66, owner: 'Univision' },

    // DMA 4 - Philadelphia
    { id: 'wpvi', dmaId: 4, callSign: 'WPVI-TV', network: 'ABC', channel: 6, owner: 'Disney' },
    { id: 'kyw', dmaId: 4, callSign: 'KYW-TV', network: 'CBS', channel: 3, owner: 'Paramount Global' },
    { id: 'wcau', dmaId: 4, callSign: 'WCAU', network: 'NBC', channel: 10, owner: 'NBCUniversal' },
    { id: 'wtxf', dmaId: 4, callSign: 'WTXF-TV', network: 'FOX', channel: 29, owner: 'Fox Corporation' },
    { id: 'wphl', dmaId: 4, callSign: 'WPHL-TV', network: 'MyNetworkTV', channel: 17, owner: 'Nexstar Media Group' },
    { id: 'wpsg', dmaId: 4, callSign: 'WPSG', network: 'CW', channel: 57, owner: 'Paramount Global' },
    { id: 'whyy', dmaId: 4, callSign: 'WHYY-TV', network: 'PBS', channel: 12, owner: 'WHYY' },

    // DMA 5 - Dallas-Ft. Worth
    { id: 'wfaa', dmaId: 5, callSign: 'WFAA', network: 'ABC', channel: 8, owner: 'Tegna' },
    { id: 'ktvt', dmaId: 5, callSign: 'KTVT', network: 'CBS', channel: 11, owner: 'Paramount Global' },
    { id: 'kxas', dmaId: 5, callSign: 'KXAS-TV', network: 'NBC', channel: 5, owner: 'NBCUniversal' },
    { id: 'kdfw', dmaId: 5, callSign: 'KDFW', network: 'FOX', channel: 4, owner: 'Fox Corporation' },
    { id: 'kdaf', dmaId: 5, callSign: 'KDAF', network: 'CW', channel: 33, owner: 'Tribune Broadcasting' },
    { id: 'kera', dmaId: 5, callSign: 'KERA-TV', network: 'PBS', channel: 13, owner: 'KERA' },
    { id: 'kxtx', dmaId: 5, callSign: 'KXTX-TV', network: 'Telemundo', channel: 39, owner: 'NBCUniversal' },
    { id: 'kuvn', dmaId: 5, callSign: 'KUVN-DT', network: 'Univision', channel: 23, owner: 'Univision' },

    // DMA 6 - San Francisco
    { id: 'kgo', dmaId: 6, callSign: 'KGO-TV', network: 'ABC', channel: 7, owner: 'Disney' },
    { id: 'kpix', dmaId: 6, callSign: 'KPIX-TV', network: 'CBS', channel: 5, owner: 'Paramount Global' },
    { id: 'kntv', dmaId: 6, callSign: 'KNTV', network: 'NBC', channel: 11, owner: 'NBCUniversal' },
    { id: 'ktvu', dmaId: 6, callSign: 'KTVU', network: 'FOX', channel: 2, owner: 'Fox Corporation' },
    { id: 'kron', dmaId: 6, callSign: 'KRON-TV', network: 'MyNetworkTV', channel: 4, owner: 'Nexstar Media Group' },
    { id: 'kbcw', dmaId: 6, callSign: 'KBCW', network: 'CW', channel: 44, owner: 'Paramount Global' },
    { id: 'kqed', dmaId: 6, callSign: 'KQED', network: 'PBS', channel: 9, owner: 'KQED' },

    // DMA 7 - Atlanta
    { id: 'wsb', dmaId: 7, callSign: 'WSB-TV', network: 'ABC', channel: 2, owner: 'Cox Media Group' },
    { id: 'wgcl', dmaId: 7, callSign: 'WGCL-TV', network: 'CBS', channel: 46, owner: 'Gray Television' },
    { id: 'wxia', dmaId: 7, callSign: 'WXIA-TV', network: 'NBC', channel: 11, owner: 'Tegna' },
    { id: 'waga', dmaId: 7, callSign: 'WAGA-TV', network: 'FOX', channel: 5, owner: 'Fox Corporation' },
    { id: 'wupa', dmaId: 7, callSign: 'WUPA', network: 'CW', channel: 69, owner: 'Paramount Global' },
    { id: 'wpba', dmaId: 7, callSign: 'WPBA', network: 'PBS', channel: 30, owner: 'Atlanta Public Schools' },

    // DMA 8 - Houston
    { id: 'ktrk', dmaId: 8, callSign: 'KTRK-TV', network: 'ABC', channel: 13, owner: 'Disney' },
    { id: 'khou', dmaId: 8, callSign: 'KHOU-TV', network: 'CBS', channel: 11, owner: 'Tegna' },
    { id: 'kprc', dmaId: 8, callSign: 'KPRC-TV', network: 'NBC', channel: 2, owner: 'Graham Media Group' },
    { id: 'kriv', dmaId: 8, callSign: 'KRIV', network: 'FOX', channel: 26, owner: 'Fox Corporation' },
    { id: 'kiah', dmaId: 8, callSign: 'KIAH', network: 'CW', channel: 39, owner: 'Nexstar Media Group' },
    { id: 'kuht', dmaId: 8, callSign: 'KUHT', network: 'PBS', channel: 8, owner: 'University of Houston' },

    // DMA 9 - Washington DC
    { id: 'wjla', dmaId: 9, callSign: 'WJLA-TV', network: 'ABC', channel: 7, owner: 'Sinclair Broadcast Group' },
    { id: 'wusa', dmaId: 9, callSign: 'WUSA', network: 'CBS', channel: 9, owner: 'Tegna' },
    { id: 'wrc', dmaId: 9, callSign: 'WRC-TV', network: 'NBC', channel: 4, owner: 'NBCUniversal' },
    { id: 'wttg', dmaId: 9, callSign: 'WTTG', network: 'FOX', channel: 5, owner: 'Fox Corporation' },
    { id: 'wdcw', dmaId: 9, callSign: 'WDCW', network: 'CW', channel: 50, owner: 'Nexstar Media Group' },
    { id: 'weta', dmaId: 9, callSign: 'WETA-TV', network: 'PBS', channel: 26, owner: 'WETA' },

    // DMA 10 - Boston
    { id: 'wcvb', dmaId: 10, callSign: 'WCVB-TV', network: 'ABC', channel: 5, owner: 'Hearst Television' },
    { id: 'wbz', dmaId: 10, callSign: 'WBZ-TV', network: 'CBS', channel: 4, owner: 'Paramount Global' },
    { id: 'wbts', dmaId: 10, callSign: 'WBTS-CD', network: 'NBC', channel: 10, owner: 'NBCUniversal' },
    { id: 'wfxt', dmaId: 10, callSign: 'WFXT', network: 'FOX', channel: 25, owner: 'Fox Corporation' },
    { id: 'wlvi', dmaId: 10, callSign: 'WLVI-TV', network: 'CW', channel: 56, owner: 'Nexstar Media Group' },
    { id: 'wgbh', dmaId: 10, callSign: 'WGBH-TV', network: 'PBS', channel: 2, owner: 'WGBH' },

    // Additional major markets (abbreviated for brevity - full list would include all stations)
    // DMA 11-25 stations...
    { id: 'knxv', dmaId: 11, callSign: 'KNXV-TV', network: 'ABC', channel: 15, owner: 'E.W. Scripps Company' },
    { id: 'kpho', dmaId: 11, callSign: 'KPHO-TV', network: 'CBS', channel: 5, owner: 'Paramount Global' },
    { id: 'kpnx', dmaId: 11, callSign: 'KPNX', network: 'NBC', channel: 12, owner: 'Tegna' },
    { id: 'ksaz', dmaId: 11, callSign: 'KSAZ-TV', network: 'FOX', channel: 10, owner: 'Fox Corporation' },

    { id: 'komo', dmaId: 12, callSign: 'KOMO-TV', network: 'ABC', channel: 4, owner: 'Sinclair Broadcast Group' },
    { id: 'kiro', dmaId: 12, callSign: 'KIRO-TV', network: 'CBS', channel: 7, owner: 'Cox Media Group' },
    { id: 'king', dmaId: 12, callSign: 'KING-TV', network: 'NBC', channel: 5, owner: 'Tegna' },
    { id: 'kcpq', dmaId: 12, callSign: 'KCPQ', network: 'FOX', channel: 13, owner: 'Fox Corporation' },

    { id: 'wfts', dmaId: 13, callSign: 'WFTS-TV', network: 'ABC', channel: 28, owner: 'E.W. Scripps Company' },
    { id: 'wtsp', dmaId: 13, callSign: 'WTSP', network: 'CBS', channel: 10, owner: 'Tegna' },
    { id: 'wfla', dmaId: 13, callSign: 'WFLA-TV', network: 'NBC', channel: 8, owner: 'Nexstar Media Group' },
    { id: 'wtvt', dmaId: 13, callSign: 'WTVT', network: 'FOX', channel: 13, owner: 'Fox Corporation' },

    { id: 'kstp', dmaId: 14, callSign: 'KSTP-TV', network: 'ABC', channel: 5, owner: 'Hubbard Broadcasting' },
    { id: 'wcco', dmaId: 14, callSign: 'WCCO-TV', network: 'CBS', channel: 4, owner: 'Paramount Global' },
    { id: 'kare', dmaId: 14, callSign: 'KARE', network: 'NBC', channel: 11, owner: 'Tegna' },
    { id: 'kmsp', dmaId: 14, callSign: 'KMSP-TV', network: 'FOX', channel: 9, owner: 'Fox Corporation' },

    { id: 'kmgh', dmaId: 15, callSign: 'KMGH-TV', network: 'ABC', channel: 7, owner: 'E.W. Scripps Company' },
    { id: 'kcnc', dmaId: 15, callSign: 'KCNC-TV', network: 'CBS', channel: 4, owner: 'Paramount Global' },
    { id: 'kusa', dmaId: 15, callSign: 'KUSA', network: 'NBC', channel: 9, owner: 'Tegna' },
    { id: 'kdvr', dmaId: 15, callSign: 'KDVR', network: 'FOX', channel: 31, owner: 'Nexstar Media Group' },

    // DMA 16 - Orlando-Daytona Beach
    { id: 'wftv', dmaId: 16, callSign: 'WFTV', network: 'ABC', channel: 9, owner: 'Cox Media Group' },
    { id: 'wkmg', dmaId: 16, callSign: 'WKMG-TV', network: 'CBS', channel: 6, owner: 'Graham Media Group' },
    { id: 'wesh', dmaId: 16, callSign: 'WESH', network: 'NBC', channel: 2, owner: 'Hearst Television' },
    { id: 'wofl', dmaId: 16, callSign: 'WOFL', network: 'FOX', channel: 35, owner: 'Fox Corporation' },

    // DMA 17 - Miami-Ft. Lauderdale
    { id: 'wplg', dmaId: 17, callSign: 'WPLG', network: 'ABC', channel: 10, owner: 'Berkshire Hathaway' },
    { id: 'wfor', dmaId: 17, callSign: 'WFOR-TV', network: 'CBS', channel: 4, owner: 'Paramount Global' },
    { id: 'wtvj', dmaId: 17, callSign: 'WTVJ', network: 'NBC', channel: 6, owner: 'NBCUniversal' },
    { id: 'wsvn', dmaId: 17, callSign: 'WSVN', network: 'FOX', channel: 7, owner: 'Sunbeam Television' },

    // DMA 18 - Cleveland-Akron
    { id: 'wews', dmaId: 18, callSign: 'WEWS-TV', network: 'ABC', channel: 5, owner: 'E.W. Scripps Company' },
    { id: 'woio', dmaId: 18, callSign: 'WOIO', network: 'CBS', channel: 19, owner: 'Gray Television' },
    { id: 'wkyc', dmaId: 18, callSign: 'WKYC', network: 'NBC', channel: 3, owner: 'Tegna' },
    { id: 'wjw', dmaId: 18, callSign: 'WJW', network: 'FOX', channel: 8, owner: 'Gray Television' },

    // DMA 19 - Sacramento-Stockton
    { id: 'kxtv', dmaId: 19, callSign: 'KXTV', network: 'ABC', channel: 10, owner: 'Tegna' },
    { id: 'kovr', dmaId: 19, callSign: 'KOVR', network: 'CBS', channel: 13, owner: 'Paramount Global' },
    { id: 'kcra', dmaId: 19, callSign: 'KCRA-TV', network: 'NBC', channel: 3, owner: 'Hearst Television' },
    { id: 'ktxl', dmaId: 19, callSign: 'KTXL', network: 'FOX', channel: 40, owner: 'Nexstar Media Group' },

    // DMA 20 - St. Louis
    { id: 'ktvi', dmaId: 20, callSign: 'KTVI', network: 'FOX', channel: 2, owner: 'Nexstar Media Group' },
    { id: 'kmov', dmaId: 20, callSign: 'KMOV', network: 'CBS', channel: 4, owner: 'Gray Television' },
    { id: 'ksdk', dmaId: 20, callSign: 'KSDK', network: 'NBC', channel: 5, owner: 'Tegna' },
    { id: 'kdnl', dmaId: 20, callSign: 'KDNL-TV', network: 'ABC', channel: 30, owner: 'Sinclair Broadcast Group' },

    // DMA 21 - Portland, OR
    { id: 'katu', dmaId: 21, callSign: 'KATU', network: 'ABC', channel: 2, owner: 'Sinclair Broadcast Group' },
    { id: 'koin', dmaId: 21, callSign: 'KOIN', network: 'CBS', channel: 6, owner: 'Nexstar Media Group' },
    { id: 'kgw', dmaId: 21, callSign: 'KGW', network: 'NBC', channel: 8, owner: 'Tegna' },
    { id: 'kptv', dmaId: 21, callSign: 'KPTV', network: 'FOX', channel: 12, owner: 'Gray Television' },

    // DMA 22 - Charlotte
    { id: 'wsoc', dmaId: 22, callSign: 'WSOC-TV', network: 'ABC', channel: 9, owner: 'Cox Media Group' },
    { id: 'wbtv', dmaId: 22, callSign: 'WBTV', network: 'CBS', channel: 3, owner: 'Gray Television' },
    { id: 'wcnc', dmaId: 22, callSign: 'WCNC-TV', network: 'NBC', channel: 36, owner: 'Tegna' },
    { id: 'wjzy', dmaId: 22, callSign: 'WJZY', network: 'FOX', channel: 46, owner: 'Fox Corporation' },

    // DMA 23 - Pittsburgh
    { id: 'wtae', dmaId: 23, callSign: 'WTAE-TV', network: 'ABC', channel: 4, owner: 'Hearst Television' },
    { id: 'kdka', dmaId: 23, callSign: 'KDKA-TV', network: 'CBS', channel: 2, owner: 'Paramount Global' },
    { id: 'wpxi', dmaId: 23, callSign: 'WPXI', network: 'NBC', channel: 11, owner: 'Cox Media Group' },
    { id: 'wpgh', dmaId: 23, callSign: 'WPGH-TV', network: 'FOX', channel: 53, owner: 'Sinclair Broadcast Group' },

    // DMA 24 - Raleigh-Durham
    { id: 'wtvd', dmaId: 24, callSign: 'WTVD', network: 'ABC', channel: 11, owner: 'Disney' },
    { id: 'wral', dmaId: 24, callSign: 'WRAL-TV', network: 'CBS', channel: 5, owner: 'Capitol Broadcasting' },
    { id: 'wncn', dmaId: 24, callSign: 'WNCN', network: 'CBS', channel: 17, owner: 'Nexstar Media Group' },
    { id: 'wraz', dmaId: 24, callSign: 'WRAZ', network: 'FOX', channel: 50, owner: 'Capitol Broadcasting' },

    // DMA 25 - Indianapolis
    { id: 'wrtv', dmaId: 25, callSign: 'WRTV', network: 'ABC', channel: 6, owner: 'E.W. Scripps Company' },
    { id: 'wttv', dmaId: 25, callSign: 'WTTV', network: 'CBS', channel: 4, owner: 'Paramount Global' },
    { id: 'wthr', dmaId: 25, callSign: 'WTHR', network: 'NBC', channel: 13, owner: 'Tegna' },
    { id: 'wxin', dmaId: 25, callSign: 'WXIN', network: 'FOX', channel: 59, owner: 'Nexstar Media Group' },

    // DMA 26 - Baltimore
    { id: 'wmar', dmaId: 26, callSign: 'WMAR-TV', network: 'ABC', channel: 2, owner: 'E.W. Scripps Company' },
    { id: 'wjz', dmaId: 26, callSign: 'WJZ-TV', network: 'CBS', channel: 13, owner: 'Paramount Global' },
    { id: 'wbal', dmaId: 26, callSign: 'WBAL-TV', network: 'NBC', channel: 11, owner: 'Hearst Television' },
    { id: 'wbff', dmaId: 26, callSign: 'WBFF', network: 'FOX', channel: 45, owner: 'Sinclair Broadcast Group' },

    // DMA 27 - Nashville
    { id: 'wkrn', dmaId: 27, callSign: 'WKRN-TV', network: 'ABC', channel: 2, owner: 'Nexstar Media Group' },
    { id: 'wtvf', dmaId: 27, callSign: 'WTVF', network: 'CBS', channel: 5, owner: 'E.W. Scripps Company' },
    { id: 'wsmv', dmaId: 27, callSign: 'WSMV-TV', network: 'NBC', channel: 4, owner: 'Meredith Corporation' },
    { id: 'wztv', dmaId: 27, callSign: 'WZTV', network: 'FOX', channel: 17, owner: 'Sinclair Broadcast Group' },

    // DMA 28 - San Diego
    { id: 'kgtv', dmaId: 28, callSign: 'KGTV', network: 'ABC', channel: 10, owner: 'E.W. Scripps Company' },
    { id: 'kfmb', dmaId: 28, callSign: 'KFMB-TV', network: 'CBS', channel: 8, owner: 'Tegna' },
    { id: 'knsd', dmaId: 28, callSign: 'KNSD', network: 'NBC', channel: 39, owner: 'NBCUniversal' },
    { id: 'kswb', dmaId: 28, callSign: 'KSWB-TV', network: 'FOX', channel: 69, owner: 'Nexstar Media Group' },

    // DMA 29 - Hartford-New Haven
    { id: 'wtnh', dmaId: 29, callSign: 'WTNH', network: 'ABC', channel: 8, owner: 'Nexstar Media Group' },
    { id: 'wfsb', dmaId: 29, callSign: 'WFSB', network: 'CBS', channel: 3, owner: 'Gray Television' },
    { id: 'wvit', dmaId: 29, callSign: 'WVIT', network: 'NBC', channel: 30, owner: 'NBCUniversal' },
    { id: 'wtic', dmaId: 29, callSign: 'WTIC-TV', network: 'FOX', channel: 61, owner: 'Nexstar Media Group' },

    // DMA 30 - Salt Lake City
    { id: 'ktvx', dmaId: 30, callSign: 'KTVX', network: 'ABC', channel: 4, owner: 'Nexstar Media Group' },
    { id: 'kutv', dmaId: 30, callSign: 'KUTV', network: 'CBS', channel: 2, owner: 'Sinclair Broadcast Group' },
    { id: 'ksl', dmaId: 30, callSign: 'KSL-TV', network: 'NBC', channel: 5, owner: 'Bonneville International' },
    { id: 'kstu', dmaId: 30, callSign: 'KSTU', network: 'FOX', channel: 13, owner: 'Fox Corporation' },
];

// =============================================================================
// RADIO STATIONS BY DMA
// =============================================================================

export const RADIO_STATIONS: RadioStation[] = [
    // DMA 1 - New York
    { id: 'wabc-am', dmaId: 1, callSign: 'WABC', frequency: '770', band: 'AM', format: 'Talk', owner: 'Cumulus Media', marketRank: 1 },
    { id: 'wcbs-fm', dmaId: 1, callSign: 'WCBS-FM', frequency: '101.1', band: 'FM', format: 'Classic Hits', owner: 'Audacy', marketRank: 2 },
    { id: 'wltw', dmaId: 1, callSign: 'WLTW', frequency: '106.7', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'whtz', dmaId: 1, callSign: 'WHTZ', frequency: '100.3', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 4 },
    { id: 'wins', dmaId: 1, callSign: 'WINS', frequency: '1010', band: 'AM', format: 'News', owner: 'Audacy', marketRank: 5 },
    { id: 'wfan', dmaId: 1, callSign: 'WFAN', frequency: '660', band: 'AM', format: 'Sports', owner: 'Audacy', marketRank: 6 },
    { id: 'waxq', dmaId: 1, callSign: 'WAXQ', frequency: '104.3', band: 'FM', format: 'Classic Rock', owner: 'iHeartMedia', marketRank: 7 },
    { id: 'wplj', dmaId: 1, callSign: 'WPLJ', frequency: '95.5', band: 'FM', format: 'Hot AC', owner: 'Cumulus Media', marketRank: 8 },
    { id: 'wqht', dmaId: 1, callSign: 'WQHT', frequency: '97.1', band: 'FM', format: 'Hip-Hop', owner: 'Mediaco Holding', marketRank: 9 },
    { id: 'wwpr', dmaId: 1, callSign: 'WWPR-FM', frequency: '105.1', band: 'FM', format: 'Hip-Hop', owner: 'iHeartMedia', marketRank: 10 },

    // DMA 2 - Los Angeles
    { id: 'kiis', dmaId: 2, callSign: 'KIIS-FM', frequency: '102.7', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'kroq', dmaId: 2, callSign: 'KROQ-FM', frequency: '106.7', band: 'FM', format: 'Alternative Rock', owner: 'Audacy', marketRank: 2 },
    { id: 'kost', dmaId: 2, callSign: 'KOST', frequency: '103.5', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'kpwr', dmaId: 2, callSign: 'KPWR', frequency: '105.9', band: 'FM', format: 'Hip-Hop', owner: 'Meruelo Media', marketRank: 4 },
    { id: 'kfi', dmaId: 2, callSign: 'KFI', frequency: '640', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 5 },
    { id: 'klos', dmaId: 2, callSign: 'KLOS', frequency: '95.5', band: 'FM', format: 'Classic Rock', owner: 'Cumulus Media', marketRank: 6 },
    { id: 'krla', dmaId: 2, callSign: 'KRLA', frequency: '870', band: 'AM', format: 'Conservative Talk', owner: 'Salem Communications', marketRank: 7 },
    { id: 'kbig', dmaId: 2, callSign: 'KBIG-FM', frequency: '104.3', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 8 },

    // DMA 3 - Chicago
    { id: 'wgn-am', dmaId: 3, callSign: 'WGN', frequency: '720', band: 'AM', format: 'News/Talk', owner: 'Nexstar Media Group', marketRank: 1 },
    { id: 'wbbm-fm', dmaId: 3, callSign: 'WBBM-FM', frequency: '96.3', band: 'FM', format: 'Top 40', owner: 'Audacy', marketRank: 2 },
    { id: 'wusn', dmaId: 3, callSign: 'WUSN', frequency: '99.5', band: 'FM', format: 'Country', owner: 'Audacy', marketRank: 3 },
    { id: 'wtmx', dmaId: 3, callSign: 'WTMX', frequency: '101.9', band: 'FM', format: 'Hot AC', owner: 'Hubbard Broadcasting', marketRank: 4 },
    { id: 'wscr', dmaId: 3, callSign: 'WSCR', frequency: '670', band: 'AM', format: 'Sports', owner: 'Audacy', marketRank: 5 },
    { id: 'wbbm-am', dmaId: 3, callSign: 'WBBM', frequency: '780', band: 'AM', format: 'News', owner: 'Audacy', marketRank: 6 },
    { id: 'wxrt', dmaId: 3, callSign: 'WXRT', frequency: '93.1', band: 'FM', format: 'Adult Album Alternative', owner: 'Audacy', marketRank: 7 },
    { id: 'wlit', dmaId: 3, callSign: 'WLIT-FM', frequency: '93.9', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 8 },

    // DMA 4 - Philadelphia
    { id: 'kyw-am', dmaId: 4, callSign: 'KYW', frequency: '1060', band: 'AM', format: 'News', owner: 'Audacy', marketRank: 1 },
    { id: 'wmmr', dmaId: 4, callSign: 'WMMR', frequency: '93.3', band: 'FM', format: 'Rock', owner: 'Beasley Broadcast Group', marketRank: 2 },
    { id: 'wbeb', dmaId: 4, callSign: 'WBEB', frequency: '101.1', band: 'FM', format: 'Adult Contemporary', owner: 'Beasley Broadcast Group', marketRank: 3 },
    { id: 'wip', dmaId: 4, callSign: 'WIP-FM', frequency: '94.1', band: 'FM', format: 'Sports', owner: 'Audacy', marketRank: 4 },
    { id: 'wxtu', dmaId: 4, callSign: 'WXTU', frequency: '92.5', band: 'FM', format: 'Country', owner: 'Beasley Broadcast Group', marketRank: 5 },

    // DMA 5 - Dallas-Ft. Worth
    { id: 'kvil', dmaId: 5, callSign: 'KVIL', frequency: '103.7', band: 'FM', format: 'Adult Contemporary', owner: 'Cumulus Media', marketRank: 1 },
    { id: 'khks', dmaId: 5, callSign: 'KHKS', frequency: '106.1', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'krld', dmaId: 5, callSign: 'KRLD', frequency: '1080', band: 'AM', format: 'News', owner: 'Audacy', marketRank: 3 },
    { id: 'klty', dmaId: 5, callSign: 'KLTY', frequency: '94.9', band: 'FM', format: 'Christian Contemporary', owner: 'Salem Communications', marketRank: 4 },
    { id: 'kscs', dmaId: 5, callSign: 'KSCS', frequency: '96.3', band: 'FM', format: 'Country', owner: 'Cumulus Media', marketRank: 5 },
    { id: 'ktck', dmaId: 5, callSign: 'KTCK', frequency: '1310', band: 'AM', format: 'Sports', owner: 'Cumulus Media', marketRank: 6 },

    // DMA 6 - San Francisco
    { id: 'kqed-fm', dmaId: 6, callSign: 'KQED', frequency: '88.5', band: 'FM', format: 'NPR', owner: 'KQED Inc', marketRank: 1 },
    { id: 'koit', dmaId: 6, callSign: 'KOIT', frequency: '96.5', band: 'FM', format: 'Adult Contemporary', owner: 'Bonneville International', marketRank: 2 },
    { id: 'knbr', dmaId: 6, callSign: 'KNBR', frequency: '680', band: 'AM', format: 'Sports', owner: 'Cumulus Media', marketRank: 3 },
    { id: 'kfog', dmaId: 6, callSign: 'KFOG', frequency: '104.5', band: 'FM', format: 'Adult Album Alternative', owner: 'Cumulus Media', marketRank: 4 },
    { id: 'kcbs-am', dmaId: 6, callSign: 'KCBS', frequency: '740', band: 'AM', format: 'News', owner: 'Audacy', marketRank: 5 },

    // DMA 7 - Atlanta
    { id: 'wstr', dmaId: 7, callSign: 'WSTR', frequency: '94.1', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'wabe', dmaId: 7, callSign: 'WABE', frequency: '90.1', band: 'FM', format: 'NPR', owner: 'Atlanta Public Schools', marketRank: 2 },
    { id: 'wsb-am', dmaId: 7, callSign: 'WSB', frequency: '750', band: 'AM', format: 'News/Talk', owner: 'Cox Media Group', marketRank: 3 },
    { id: 'wwwq', dmaId: 7, callSign: 'WWWQ', frequency: '99.7', band: 'FM', format: 'Country', owner: 'Cumulus Media', marketRank: 4 },
    { id: 'wvee', dmaId: 7, callSign: 'WVEE', frequency: '103.3', band: 'FM', format: 'Hip-Hop', owner: 'Audacy', marketRank: 5 },

    // DMA 8 - Houston
    { id: 'kbxx', dmaId: 8, callSign: 'KBXX', frequency: '97.9', band: 'FM', format: 'Hip-Hop', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'koda', dmaId: 8, callSign: 'KODA', frequency: '99.1', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'ktrh', dmaId: 8, callSign: 'KTRH', frequency: '740', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'krbe', dmaId: 8, callSign: 'KRBE', frequency: '104.1', band: 'FM', format: 'Top 40', owner: 'Audacy', marketRank: 4 },
    { id: 'kilt', dmaId: 8, callSign: 'KILT-FM', frequency: '100.3', band: 'FM', format: 'Country', owner: 'Audacy', marketRank: 5 },

    // DMA 9 - Washington DC
    { id: 'wtop', dmaId: 9, callSign: 'WTOP-FM', frequency: '103.5', band: 'FM', format: 'News', owner: 'Hubbard Broadcasting', marketRank: 1 },
    { id: 'wmal', dmaId: 9, callSign: 'WMAL', frequency: '630', band: 'AM', format: 'Conservative Talk', owner: 'Cumulus Media', marketRank: 2 },
    { id: 'wash', dmaId: 9, callSign: 'WASH', frequency: '97.1', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wiht', dmaId: 9, callSign: 'WIHT', frequency: '99.5', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 4 },
    { id: 'wamu', dmaId: 9, callSign: 'WAMU', frequency: '88.5', band: 'FM', format: 'NPR', owner: 'American University', marketRank: 5 },

    // DMA 10 - Boston
    { id: 'wbz-am', dmaId: 10, callSign: 'WBZ', frequency: '1030', band: 'AM', format: 'News', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'wxks', dmaId: 10, callSign: 'WXKS-FM', frequency: '107.9', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wbur', dmaId: 10, callSign: 'WBUR-FM', frequency: '90.9', band: 'FM', format: 'NPR', owner: 'Boston University', marketRank: 3 },
    { id: 'wzlx', dmaId: 10, callSign: 'WZLX', frequency: '100.7', band: 'FM', format: 'Classic Rock', owner: 'Audacy', marketRank: 4 },
    { id: 'wgbh-fm', dmaId: 10, callSign: 'WGBH', frequency: '89.7', band: 'FM', format: 'NPR/Classical', owner: 'WGBH', marketRank: 5 },

    // DMA 11 - Phoenix
    { id: 'ktar', dmaId: 11, callSign: 'KTAR-FM', frequency: '92.3', band: 'FM', format: 'News/Talk', owner: 'Bonneville International', marketRank: 1 },
    { id: 'kzzp', dmaId: 11, callSign: 'KZZP', frequency: '104.7', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'kesz', dmaId: 11, callSign: 'KESZ', frequency: '99.9', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'knix', dmaId: 11, callSign: 'KNIX', frequency: '102.5', band: 'FM', format: 'Country', owner: 'iHeartMedia', marketRank: 4 },
    { id: 'kupd', dmaId: 11, callSign: 'KUPD', frequency: '97.9', band: 'FM', format: 'Rock', owner: 'Hubbard Broadcasting', marketRank: 5 },

    // DMA 12 - Seattle-Tacoma
    { id: 'kiro-fm', dmaId: 12, callSign: 'KIRO-FM', frequency: '97.3', band: 'FM', format: 'Sports', owner: 'Bonneville International', marketRank: 1 },
    { id: 'knkx', dmaId: 12, callSign: 'KNKX', frequency: '88.5', band: 'FM', format: 'NPR/Jazz', owner: 'Pacific Lutheran University', marketRank: 2 },
    { id: 'kexp', dmaId: 12, callSign: 'KEXP', frequency: '90.3', band: 'FM', format: 'Alternative', owner: 'University of Washington', marketRank: 3 },
    { id: 'komo-am', dmaId: 12, callSign: 'KOMO', frequency: '1000', band: 'AM', format: 'News/Talk', owner: 'Sinclair Broadcast Group', marketRank: 4 },
    { id: 'kisw', dmaId: 12, callSign: 'KISW', frequency: '99.9', band: 'FM', format: 'Rock', owner: 'Audacy', marketRank: 5 },

    // DMA 13 - Tampa-St. Petersburg
    { id: 'wflz', dmaId: 13, callSign: 'WFLZ', frequency: '93.3', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'wqyk', dmaId: 13, callSign: 'WQYK-FM', frequency: '99.5', band: 'FM', format: 'Country', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wusf', dmaId: 13, callSign: 'WUSF', frequency: '89.7', band: 'FM', format: 'NPR', owner: 'University of South Florida', marketRank: 3 },
    { id: 'whpt', dmaId: 13, callSign: 'WHPT', frequency: '102.5', band: 'FM', format: 'Classic Rock', owner: 'Beasley Broadcast Group', marketRank: 4 },
    { id: 'wdae', dmaId: 13, callSign: 'WDAE', frequency: '620', band: 'AM', format: 'Sports', owner: 'iHeartMedia', marketRank: 5 },

    // DMA 14 - Minneapolis-St. Paul
    { id: 'wcco-am', dmaId: 14, callSign: 'WCCO', frequency: '830', band: 'AM', format: 'News/Talk', owner: 'Audacy', marketRank: 1 },
    { id: 'kdwb', dmaId: 14, callSign: 'KDWB-FM', frequency: '101.3', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'kqrs', dmaId: 14, callSign: 'KQRS-FM', frequency: '92.5', band: 'FM', format: 'Classic Rock', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'kmoj', dmaId: 14, callSign: 'KMOJ', frequency: '89.9', band: 'FM', format: 'Urban', owner: 'KMOJ-FM Inc', marketRank: 4 },
    { id: 'mpr', dmaId: 14, callSign: 'MPR', frequency: '91.1', band: 'FM', format: 'NPR', owner: 'Minnesota Public Radio', marketRank: 5 },

    // DMA 15 - Denver
    { id: 'koa', dmaId: 15, callSign: 'KOA', frequency: '850', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'kosi', dmaId: 15, callSign: 'KOSI', frequency: '101.1', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'kygo', dmaId: 15, callSign: 'KYGO-FM', frequency: '98.5', band: 'FM', format: 'Country', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'kbco', dmaId: 15, callSign: 'KBCO', frequency: '97.3', band: 'FM', format: 'Adult Album Alternative', owner: 'Bonneville International', marketRank: 4 },
    { id: 'cpr', dmaId: 15, callSign: 'CPR', frequency: '90.1', band: 'FM', format: 'NPR', owner: 'Colorado Public Radio', marketRank: 5 },

    // DMA 16 - Orlando-Daytona Beach
    { id: 'wdbo', dmaId: 16, callSign: 'WDBO', frequency: '580', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'wxxl', dmaId: 16, callSign: 'WXXL', frequency: '106.7', band: 'FM', format: 'Top 40', owner: 'Cox Media Group', marketRank: 2 },
    { id: 'wmmo', dmaId: 16, callSign: 'WMMO', frequency: '98.9', band: 'FM', format: 'Classic Hits', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wmfe', dmaId: 16, callSign: 'WMFE', frequency: '90.7', band: 'FM', format: 'NPR', owner: 'Community Communications', marketRank: 4 },

    // DMA 17 - Miami-Ft. Lauderdale
    { id: 'wiod', dmaId: 17, callSign: 'WIOD', frequency: '610', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'whqt', dmaId: 17, callSign: 'WHQT', frequency: '105.1', band: 'FM', format: 'Hip-Hop', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wlyf', dmaId: 17, callSign: 'WLYF', frequency: '101.5', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wflc', dmaId: 17, callSign: 'WFLC', frequency: '97.3', band: 'FM', format: 'Top 40', owner: 'Audacy', marketRank: 4 },
    { id: 'wlrn', dmaId: 17, callSign: 'WLRN-FM', frequency: '91.3', band: 'FM', format: 'NPR', owner: 'Miami-Dade County Public Schools', marketRank: 5 },

    // DMA 18 - Cleveland-Akron
    { id: 'wtam', dmaId: 18, callSign: 'WTAM', frequency: '1100', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'wgar', dmaId: 18, callSign: 'WGAR-FM', frequency: '99.5', band: 'FM', format: 'Country', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wmms', dmaId: 18, callSign: 'WMMS', frequency: '100.7', band: 'FM', format: 'Rock', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wksu', dmaId: 18, callSign: 'WKSU', frequency: '89.7', band: 'FM', format: 'NPR', owner: 'Ideastream Public Media', marketRank: 4 },

    // DMA 19 - Sacramento-Stockton
    { id: 'kfbk', dmaId: 19, callSign: 'KFBK', frequency: '1530', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'knci', dmaId: 19, callSign: 'KNCI', frequency: '105.1', band: 'FM', format: 'Country', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'kdnd', dmaId: 19, callSign: 'KDND', frequency: '107.9', band: 'FM', format: 'Top 40', owner: 'Audacy', marketRank: 3 },
    { id: 'kxjz', dmaId: 19, callSign: 'KXJZ', frequency: '88.9', band: 'FM', format: 'NPR', owner: 'Capital Public Radio', marketRank: 4 },

    // DMA 20 - St. Louis
    { id: 'kmox', dmaId: 20, callSign: 'KMOX', frequency: '1120', band: 'AM', format: 'News/Talk', owner: 'Audacy', marketRank: 1 },
    { id: 'kshe', dmaId: 20, callSign: 'KSHE', frequency: '94.7', band: 'FM', format: 'Classic Rock', owner: 'Hubbard Broadcasting', marketRank: 2 },
    { id: 'kyky', dmaId: 20, callSign: 'KYKY', frequency: '98.1', band: 'FM', format: 'Adult Contemporary', owner: 'Hubbard Broadcasting', marketRank: 3 },
    { id: 'kwmu', dmaId: 20, callSign: 'KWMU', frequency: '90.7', band: 'FM', format: 'NPR', owner: 'University of Missouri-St. Louis', marketRank: 4 },

    // DMA 21 - Portland, OR
    { id: 'kpoj', dmaId: 21, callSign: 'KPOJ', frequency: '620', band: 'AM', format: 'News/Talk', owner: 'Alpha Media', marketRank: 1 },
    { id: 'knrk', dmaId: 21, callSign: 'KNRK', frequency: '94.7', band: 'FM', format: 'Alternative', owner: 'Audacy', marketRank: 2 },
    { id: 'kopb', dmaId: 21, callSign: 'KOPB-FM', frequency: '91.5', band: 'FM', format: 'NPR', owner: 'OPB', marketRank: 3 },
    { id: 'kupl', dmaId: 21, callSign: 'KUPL', frequency: '98.7', band: 'FM', format: 'Country', owner: 'Audacy', marketRank: 4 },

    // DMA 22 - Charlotte
    { id: 'wbt-am', dmaId: 22, callSign: 'WBT', frequency: '1110', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'wend', dmaId: 22, callSign: 'WEND', frequency: '106.5', band: 'FM', format: 'Alternative', owner: 'Audacy', marketRank: 2 },
    { id: 'wlnk', dmaId: 22, callSign: 'WLNK', frequency: '107.9', band: 'FM', format: 'Adult Contemporary', owner: 'Audacy', marketRank: 3 },
    { id: 'wfae', dmaId: 22, callSign: 'WFAE', frequency: '90.7', band: 'FM', format: 'NPR', owner: 'WFAE', marketRank: 4 },

    // DMA 23 - Pittsburgh
    { id: 'kdka-am', dmaId: 23, callSign: 'KDKA', frequency: '1020', band: 'AM', format: 'News/Talk', owner: 'Audacy', marketRank: 1 },
    { id: 'wdve', dmaId: 23, callSign: 'WDVE', frequency: '102.5', band: 'FM', format: 'Classic Rock', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wamo', dmaId: 23, callSign: 'WAMO', frequency: '106.7', band: 'FM', format: 'Urban', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wesa', dmaId: 23, callSign: 'WESA', frequency: '90.5', band: 'FM', format: 'NPR', owner: 'Pittsburgh Community Broadcasting', marketRank: 4 },

    // DMA 24 - Raleigh-Durham
    { id: 'wral-fm', dmaId: 24, callSign: 'WRAL-FM', frequency: '101.5', band: 'FM', format: 'Adult Contemporary', owner: 'Capitol Broadcasting', marketRank: 1 },
    { id: 'wdcg', dmaId: 24, callSign: 'WDCG', frequency: '105.1', band: 'FM', format: 'Country', owner: 'Curtis Media Group', marketRank: 2 },
    { id: 'wunc', dmaId: 24, callSign: 'WUNC', frequency: '91.5', band: 'FM', format: 'NPR', owner: 'University of North Carolina', marketRank: 3 },
    { id: 'wrdu', dmaId: 24, callSign: 'WRDU', frequency: '106.1', band: 'FM', format: 'Classic Rock', owner: 'Curtis Media Group', marketRank: 4 },

    // DMA 25 - Indianapolis
    { id: 'wibc', dmaId: 25, callSign: 'WIBC', frequency: '93.1', band: 'FM', format: 'News/Talk', owner: 'Emmis Communications', marketRank: 1 },
    { id: 'wfbq', dmaId: 25, callSign: 'WFBQ', frequency: '94.7', band: 'FM', format: 'Rock', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wfyi', dmaId: 25, callSign: 'WFYI', frequency: '90.1', band: 'FM', format: 'NPR', owner: 'WFYI Public Media', marketRank: 3 },
    { id: 'wzpl', dmaId: 25, callSign: 'WZPL', frequency: '99.5', band: 'FM', format: 'Top 40', owner: 'Emmis Communications', marketRank: 4 },

    // DMA 26 - Baltimore
    { id: 'wbal-am', dmaId: 26, callSign: 'WBAL', frequency: '1090', band: 'AM', format: 'News/Talk', owner: 'Hearst Television', marketRank: 1 },
    { id: 'wwmx', dmaId: 26, callSign: 'WWMX', frequency: '106.5', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wlif', dmaId: 26, callSign: 'WLIF', frequency: '101.9', band: 'FM', format: 'Adult Contemporary', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wypr', dmaId: 26, callSign: 'WYPR', frequency: '88.1', band: 'FM', format: 'NPR', owner: 'Your Public Radio', marketRank: 4 },

    // DMA 27 - Nashville
    { id: 'wsm', dmaId: 27, callSign: 'WSM', frequency: '650', band: 'AM', format: 'Country', owner: 'Ryman Hospitality', marketRank: 1 },
    { id: 'wsix', dmaId: 27, callSign: 'WSIX-FM', frequency: '97.9', band: 'FM', format: 'Country', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'wkdf', dmaId: 27, callSign: 'WKDF', frequency: '103.3', band: 'FM', format: 'Rock', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wpln', dmaId: 27, callSign: 'WPLN-FM', frequency: '90.3', band: 'FM', format: 'NPR', owner: 'Nashville Public Radio', marketRank: 4 },

    // DMA 28 - San Diego
    { id: 'kogo', dmaId: 28, callSign: 'KOGO', frequency: '600', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'kson', dmaId: 28, callSign: 'KSON', frequency: '103.7', band: 'FM', format: 'Country', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'kpbs-fm', dmaId: 28, callSign: 'KPBS', frequency: '89.5', band: 'FM', format: 'NPR', owner: 'San Diego State University', marketRank: 3 },
    { id: 'kbzt', dmaId: 28, callSign: 'KBZT', frequency: '94.9', band: 'FM', format: 'Alternative', owner: 'Audacy', marketRank: 4 },

    // DMA 29 - Hartford-New Haven
    { id: 'wtic-am', dmaId: 29, callSign: 'WTIC', frequency: '1080', band: 'AM', format: 'News/Talk', owner: 'iHeartMedia', marketRank: 1 },
    { id: 'wplr', dmaId: 29, callSign: 'WPLR', frequency: '99.1', band: 'FM', format: 'Rock', owner: 'Townsquare Media', marketRank: 2 },
    { id: 'wkci', dmaId: 29, callSign: 'WKCI-FM', frequency: '101.3', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 3 },
    { id: 'wnpr', dmaId: 29, callSign: 'WNPR', frequency: '90.5', band: 'FM', format: 'NPR', owner: 'Connecticut Public', marketRank: 4 },

    // DMA 30 - Salt Lake City
    { id: 'ksl-am', dmaId: 30, callSign: 'KSL', frequency: '1160', band: 'AM', format: 'News/Talk', owner: 'Bonneville International', marketRank: 1 },
    { id: 'kzht', dmaId: 30, callSign: 'KZHT', frequency: '97.1', band: 'FM', format: 'Top 40', owner: 'iHeartMedia', marketRank: 2 },
    { id: 'kubl', dmaId: 30, callSign: 'KUBL', frequency: '93.3', band: 'FM', format: 'Country', owner: 'Bonneville International', marketRank: 3 },
    { id: 'kuer', dmaId: 30, callSign: 'KUER', frequency: '90.1', band: 'FM', format: 'NPR', owner: 'University of Utah', marketRank: 4 },
];

// =============================================================================
// DOOH INVENTORY BY DMA
// =============================================================================

export const DOOH_VENUES: DOOHVenue[] = [
    // DMA 1 - New York
    { id: 'ts-jfk-1', dmaId: 1, name: 'JFK Terminal 1 Arrivals', venueType: 'Airport', address: 'JFK International Airport', city: 'Queens', state: 'NY', zipCode: '11430', latitude: 40.6413, longitude: -73.7781, screens: 24, weeklyImpressions: 850000, operator: 'Clear Channel Airports' },
    { id: 'ts-jfk-4', dmaId: 1, name: 'JFK Terminal 4 Main Hall', venueType: 'Airport', address: 'JFK International Airport', city: 'Queens', state: 'NY', zipCode: '11430', latitude: 40.6426, longitude: -73.7793, screens: 36, weeklyImpressions: 1200000, operator: 'Clear Channel Airports' },
    { id: 'ts-lga-1', dmaId: 1, name: 'LaGuardia Terminal B', venueType: 'Airport', address: 'LaGuardia Airport', city: 'Queens', state: 'NY', zipCode: '11371', latitude: 40.7769, longitude: -73.8740, screens: 18, weeklyImpressions: 650000, operator: 'JCDecaux' },
    { id: 'ts-ewr-1', dmaId: 1, name: 'Newark Terminal A', venueType: 'Airport', address: 'Newark Liberty International', city: 'Newark', state: 'NJ', zipCode: '07114', latitude: 40.6895, longitude: -74.1745, screens: 20, weeklyImpressions: 720000, operator: 'Clear Channel Airports' },
    { id: 'ts-penn', dmaId: 1, name: 'Penn Station Main Concourse', venueType: 'Transit', address: '8th Ave & 31st St', city: 'New York', state: 'NY', zipCode: '10001', latitude: 40.7506, longitude: -73.9935, screens: 45, weeklyImpressions: 2500000, operator: 'Outfront Media' },
    { id: 'ts-gct', dmaId: 1, name: 'Grand Central Terminal', venueType: 'Transit', address: '89 E 42nd St', city: 'New York', state: 'NY', zipCode: '10017', latitude: 40.7527, longitude: -73.9772, screens: 38, weeklyImpressions: 2100000, operator: 'Outfront Media' },
    { id: 'bb-ts-1', dmaId: 1, name: 'Times Square North', venueType: 'Billboard', address: '1500 Broadway', city: 'New York', state: 'NY', zipCode: '10036', latitude: 40.7580, longitude: -73.9855, screens: 8, weeklyImpressions: 1500000, operator: 'Clear Channel Outdoor' },
    { id: 'bb-ts-2', dmaId: 1, name: 'Times Square South', venueType: 'Billboard', address: '1515 Broadway', city: 'New York', state: 'NY', zipCode: '10036', latitude: 40.7575, longitude: -73.9860, screens: 6, weeklyImpressions: 1300000, operator: 'Outfront Media' },
    { id: 'mall-hub', dmaId: 1, name: 'Hudson Yards Mall', venueType: 'Mall', address: '20 Hudson Yards', city: 'New York', state: 'NY', zipCode: '10001', latitude: 40.7537, longitude: -74.0008, screens: 25, weeklyImpressions: 450000, operator: 'JCDecaux' },
    { id: 'msg-1', dmaId: 1, name: 'Madison Square Garden', venueType: 'Stadium', address: '4 Pennsylvania Plaza', city: 'New York', state: 'NY', zipCode: '10001', latitude: 40.7505, longitude: -73.9934, screens: 120, weeklyImpressions: 800000, operator: 'MSG Networks' },

    // DMA 2 - Los Angeles
    { id: 'lax-t1', dmaId: 2, name: 'LAX Terminal 1', venueType: 'Airport', address: '1 World Way', city: 'Los Angeles', state: 'CA', zipCode: '90045', latitude: 33.9416, longitude: -118.4085, screens: 28, weeklyImpressions: 920000, operator: 'Clear Channel Airports' },
    { id: 'lax-tb', dmaId: 2, name: 'LAX Tom Bradley International', venueType: 'Airport', address: '380 World Way', city: 'Los Angeles', state: 'CA', zipCode: '90045', latitude: 33.9425, longitude: -118.4081, screens: 48, weeklyImpressions: 1800000, operator: 'JCDecaux' },
    { id: 'bb-sunset-1', dmaId: 2, name: 'Sunset Blvd Billboard', venueType: 'Billboard', address: '8000 Sunset Blvd', city: 'West Hollywood', state: 'CA', zipCode: '90046', latitude: 34.0977, longitude: -118.3617, screens: 4, weeklyImpressions: 680000, operator: 'Clear Channel Outdoor' },
    { id: 'bb-405-1', dmaId: 2, name: 'I-405 Freeway Digital', venueType: 'Billboard', address: 'I-405 & Wilshire', city: 'Los Angeles', state: 'CA', zipCode: '90024', latitude: 34.0622, longitude: -118.4498, screens: 2, weeklyImpressions: 1100000, operator: 'Lamar Advertising' },
    { id: 'hollywood-highland', dmaId: 2, name: 'Hollywood & Highland', venueType: 'Mall', address: '6801 Hollywood Blvd', city: 'Hollywood', state: 'CA', zipCode: '90028', latitude: 34.1024, longitude: -118.3415, screens: 18, weeklyImpressions: 520000, operator: 'JCDecaux' },
    { id: 'sofi-1', dmaId: 2, name: 'SoFi Stadium', venueType: 'Stadium', address: '1001 Stadium Dr', city: 'Inglewood', state: 'CA', zipCode: '90301', latitude: 33.9534, longitude: -118.3386, screens: 85, weeklyImpressions: 650000, operator: 'Outfront Media' },

    // DMA 3 - Chicago
    { id: 'ord-t1', dmaId: 3, name: "O'Hare Terminal 1", venueType: 'Airport', address: "10000 W O'Hare Ave", city: 'Chicago', state: 'IL', zipCode: '60666', latitude: 41.9742, longitude: -87.9073, screens: 32, weeklyImpressions: 1100000, operator: 'Clear Channel Airports' },
    { id: 'ord-t3', dmaId: 3, name: "O'Hare Terminal 3", venueType: 'Airport', address: "10000 W O'Hare Ave", city: 'Chicago', state: 'IL', zipCode: '60666', latitude: 41.9752, longitude: -87.9051, screens: 28, weeklyImpressions: 980000, operator: 'JCDecaux' },
    { id: 'mdw-1', dmaId: 3, name: 'Midway Airport', venueType: 'Airport', address: '5700 S Cicero Ave', city: 'Chicago', state: 'IL', zipCode: '60638', latitude: 41.7868, longitude: -87.7522, screens: 16, weeklyImpressions: 480000, operator: 'Lamar Advertising' },
    { id: 'cta-clark', dmaId: 3, name: 'CTA Clark/Lake Station', venueType: 'Transit', address: '100 W Lake St', city: 'Chicago', state: 'IL', zipCode: '60601', latitude: 41.8858, longitude: -87.6316, screens: 12, weeklyImpressions: 380000, operator: 'Intersection' },
    { id: 'bb-mag-mile', dmaId: 3, name: 'Magnificent Mile Billboard', venueType: 'Billboard', address: '900 N Michigan Ave', city: 'Chicago', state: 'IL', zipCode: '60611', latitude: 41.8995, longitude: -87.6245, screens: 4, weeklyImpressions: 720000, operator: 'Clear Channel Outdoor' },
    { id: 'soldier-1', dmaId: 3, name: 'Soldier Field', venueType: 'Stadium', address: '1410 Special Olympics Dr', city: 'Chicago', state: 'IL', zipCode: '60605', latitude: 41.8623, longitude: -87.6167, screens: 65, weeklyImpressions: 420000, operator: 'Outfront Media' },

    // DMA 5 - Dallas-Ft. Worth
    { id: 'dfw-a', dmaId: 5, name: 'DFW Terminal A', venueType: 'Airport', address: '2400 Aviation Dr', city: 'DFW Airport', state: 'TX', zipCode: '75261', latitude: 32.8998, longitude: -97.0403, screens: 24, weeklyImpressions: 780000, operator: 'Clear Channel Airports' },
    { id: 'dfw-d', dmaId: 5, name: 'DFW Terminal D', venueType: 'Airport', address: '2400 Aviation Dr', city: 'DFW Airport', state: 'TX', zipCode: '75261', latitude: 32.8968, longitude: -97.0381, screens: 36, weeklyImpressions: 1050000, operator: 'JCDecaux' },
    { id: 'love-1', dmaId: 5, name: 'Dallas Love Field', venueType: 'Airport', address: '8008 Herb Kelleher Way', city: 'Dallas', state: 'TX', zipCode: '75235', latitude: 32.8471, longitude: -96.8518, screens: 14, weeklyImpressions: 420000, operator: 'Lamar Advertising' },
    { id: 'att-stadium', dmaId: 5, name: 'AT&T Stadium', venueType: 'Stadium', address: '1 AT&T Way', city: 'Arlington', state: 'TX', zipCode: '76011', latitude: 32.7473, longitude: -97.0945, screens: 95, weeklyImpressions: 580000, operator: 'Jones Lang LaSalle' },
    { id: 'galleria-dallas', dmaId: 5, name: 'Galleria Dallas', venueType: 'Mall', address: '13350 Dallas Pkwy', city: 'Dallas', state: 'TX', zipCode: '75240', latitude: 32.9308, longitude: -96.8207, screens: 22, weeklyImpressions: 380000, operator: 'Simon Malls' },

    // DMA 7 - Atlanta
    { id: 'atl-t1', dmaId: 7, name: 'ATL Domestic Terminal', venueType: 'Airport', address: '6000 N Terminal Pkwy', city: 'Atlanta', state: 'GA', zipCode: '30320', latitude: 33.6407, longitude: -84.4277, screens: 52, weeklyImpressions: 2200000, operator: 'Clear Channel Airports' },
    { id: 'atl-intl', dmaId: 7, name: 'ATL International Terminal', venueType: 'Airport', address: '6000 N Terminal Pkwy', city: 'Atlanta', state: 'GA', zipCode: '30320', latitude: 33.6367, longitude: -84.4281, screens: 28, weeklyImpressions: 980000, operator: 'JCDecaux' },
    { id: 'marta-5pts', dmaId: 7, name: 'MARTA Five Points', venueType: 'Transit', address: '30 Alabama St SW', city: 'Atlanta', state: 'GA', zipCode: '30303', latitude: 33.7539, longitude: -84.3917, screens: 16, weeklyImpressions: 520000, operator: 'Outfront Media' },
    { id: 'mercedes-benz', dmaId: 7, name: 'Mercedes-Benz Stadium', venueType: 'Stadium', address: '1 AMB Dr NW', city: 'Atlanta', state: 'GA', zipCode: '30313', latitude: 33.7553, longitude: -84.4006, screens: 110, weeklyImpressions: 720000, operator: 'AMB Sports' },
    { id: 'lenox-sq', dmaId: 7, name: 'Lenox Square Mall', venueType: 'Mall', address: '3393 Peachtree Rd NE', city: 'Atlanta', state: 'GA', zipCode: '30326', latitude: 33.8461, longitude: -84.3626, screens: 18, weeklyImpressions: 340000, operator: 'Simon Malls' },

    // DMA 17 - Miami
    { id: 'mia-d', dmaId: 17, name: 'MIA Terminal D', venueType: 'Airport', address: '2100 NW 42nd Ave', city: 'Miami', state: 'FL', zipCode: '33142', latitude: 25.7959, longitude: -80.2870, screens: 32, weeklyImpressions: 1150000, operator: 'Clear Channel Airports' },
    { id: 'mia-s', dmaId: 17, name: 'MIA South Terminal', venueType: 'Airport', address: '2100 NW 42nd Ave', city: 'Miami', state: 'FL', zipCode: '33142', latitude: 25.7932, longitude: -80.2897, screens: 24, weeklyImpressions: 820000, operator: 'JCDecaux' },
    { id: 'fll-1', dmaId: 17, name: 'Fort Lauderdale Airport', venueType: 'Airport', address: '100 Terminal Dr', city: 'Fort Lauderdale', state: 'FL', zipCode: '33315', latitude: 26.0742, longitude: -80.1506, screens: 18, weeklyImpressions: 580000, operator: 'Lamar Advertising' },
    { id: 'hardrock-1', dmaId: 17, name: 'Hard Rock Stadium', venueType: 'Stadium', address: '347 Don Shula Dr', city: 'Miami Gardens', state: 'FL', zipCode: '33056', latitude: 25.9580, longitude: -80.2389, screens: 75, weeklyImpressions: 480000, operator: 'Dolphins Enterprises' },
    { id: 'aventura', dmaId: 17, name: 'Aventura Mall', venueType: 'Mall', address: '19501 Biscayne Blvd', city: 'Aventura', state: 'FL', zipCode: '33180', latitude: 25.9569, longitude: -80.1420, screens: 24, weeklyImpressions: 420000, operator: 'Turnberry Associates' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get DMA by ID (rank)
 */
export const getDMAById = (id: number): DMA | undefined => {
    return DMA_LIST.find(dma => dma.id === id);
};

/**
 * Get DMA by name or alias (case-insensitive)
 */
export const getDMAByName = (query: string): DMA | undefined => {
    const lowerQuery = query.toLowerCase().trim();
    return DMA_LIST.find(dma =>
        dma.name.toLowerCase() === lowerQuery ||
        dma.aliases.some(alias => alias.toLowerCase() === lowerQuery)
    );
};

/**
 * Search DMAs by partial name match
 */
export const searchDMAs = (query: string): DMA[] => {
    const lowerQuery = query.toLowerCase().trim();
    return DMA_LIST.filter(dma =>
        dma.name.toLowerCase().includes(lowerQuery) ||
        dma.aliases.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
        dma.state.toLowerCase() === lowerQuery
    );
};

/**
 * Get all TV stations for a DMA
 */
export const getTVStationsByDMA = (dmaId: number): TVStation[] => {
    return TV_STATIONS.filter(station => station.dmaId === dmaId);
};

/**
 * Get all radio stations for a DMA
 */
export const getRadioStationsByDMA = (dmaId: number): RadioStation[] => {
    return RADIO_STATIONS.filter(station => station.dmaId === dmaId);
};

/**
 * Get all DOOH venues for a DMA
 */
export const getDOOHByDMA = (dmaId: number): DOOHVenue[] => {
    return DOOH_VENUES.filter(venue => venue.dmaId === dmaId);
};

/**
 * Get DOOH venues by type within a DMA
 */
export const getDOOHByType = (dmaId: number, venueType: DOOHVenue['venueType']): DOOHVenue[] => {
    return DOOH_VENUES.filter(venue => venue.dmaId === dmaId && venue.venueType === venueType);
};

/**
 * Get all DOOH venues within radius of coordinates
 */
export const getDOOHByRadius = (lat: number, lon: number, radiusMiles: number): DOOHVenue[] => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const R = 3959; // Earth's radius in miles

    return DOOH_VENUES.filter(venue => {
        const dLat = toRad(venue.latitude - lat);
        const dLon = toRad(venue.longitude - lon);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat)) * Math.cos(toRad(venue.latitude)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance <= radiusMiles;
    });
};

/**
 * Get top N DMAs by TV households
 */
export const getTopDMAs = (count: number = 25): DMA[] => {
    return DMA_LIST.slice(0, count);
};

/**
 * Get DMAs by state
 */
export const getDMAsByState = (stateCode: string): DMA[] => {
    return DMA_LIST.filter(dma => dma.state.toLowerCase() === stateCode.toLowerCase());
};

/**
 * Calculate total TV households for a list of DMAs
 */
export const calculateTotalHouseholds = (dmaIds: number[]): number => {
    return DMA_LIST
        .filter(dma => dmaIds.includes(dma.id))
        .reduce((sum, dma) => sum + dma.tvHouseholds, 0);
};

/**
 * Calculate total US coverage percentage for a list of DMAs
 */
export const calculateUSCoverage = (dmaIds: number[]): number => {
    return DMA_LIST
        .filter(dma => dmaIds.includes(dma.id))
        .reduce((sum, dma) => sum + dma.percentUS, 0);
};

/**
 * Get DMAs that have complete broadcast data (both TV and Radio stations)
 * These are the markets we can fully feature in the interface
 */
export const getDMAsWithCompleteData = (): DMA[] => {
    // Get unique DMA IDs from TV stations
    const dmasWithTV = new Set(TV_STATIONS.map(station => station.dmaId));
    // Get unique DMA IDs from Radio stations
    const dmasWithRadio = new Set(RADIO_STATIONS.map(station => station.dmaId));

    // Find DMAs that have both TV AND Radio stations
    const completeDmaIds = [...dmasWithTV].filter(id => dmasWithRadio.has(id));

    return DMA_LIST.filter(dma => completeDmaIds.includes(dma.id));
};

/**
 * Check if a specific DMA has complete broadcast data
 */
export const dmaHasCompleteData = (dmaId: number): boolean => {
    const hasTV = TV_STATIONS.some(station => station.dmaId === dmaId);
    const hasRadio = RADIO_STATIONS.some(station => station.dmaId === dmaId);
    return hasTV && hasRadio;
};

/**
 * Get summary of data coverage by DMA
 */
export const getDataCoverageSummary = (): {
    complete: number[];      // DMAs with both TV and Radio
    tvOnly: number[];        // DMAs with only TV
    radioOnly: number[];     // DMAs with only Radio
    noData: number[];        // DMAs with neither
} => {
    const dmasWithTV = new Set(TV_STATIONS.map(station => station.dmaId));
    const dmasWithRadio = new Set(RADIO_STATIONS.map(station => station.dmaId));

    const complete: number[] = [];
    const tvOnly: number[] = [];
    const radioOnly: number[] = [];
    const noData: number[] = [];

    DMA_LIST.forEach(dma => {
        const hasTV = dmasWithTV.has(dma.id);
        const hasRadio = dmasWithRadio.has(dma.id);

        if (hasTV && hasRadio) {
            complete.push(dma.id);
        } else if (hasTV) {
            tvOnly.push(dma.id);
        } else if (hasRadio) {
            radioOnly.push(dma.id);
        } else {
            noData.push(dma.id);
        }
    });

    return { complete, tvOnly, radioOnly, noData };
};
