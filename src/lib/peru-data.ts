export interface PeruDepartment {
  name: string;
  provinces: string[];
  districts: string[];
  lat: number;
  lng: number;
}

export const PERU_DEPARTMENTS: PeruDepartment[] = [
  {
    name: "Lima",
    provinces: ["Lima", "Callao", "Huaura", "Cañete"],
    districts: [
      "Miraflores",
      "San Isidro",
      "Santiago de Surco",
      "San Borja",
      "Jesús María",
      "Magdalena del Mar",
      "Lince",
      "La Molina",
      "Pueblo Libre",
      "San Miguel",
      "Ate",
      "Los Olivos",
      "Lima Cercado",
      "Barranco",
      "Chorrillos",
    ],
    lat: -12.0464,
    lng: -77.0428,
  },
  {
    name: "Arequipa",
    provinces: ["Arequipa", "Caylloma", "Islay"],
    districts: ["Arequipa", "Yanahuara", "Cayma", "Cerro Colorado", "José Luis Bustamante y Rivero"],
    lat: -16.409,
    lng: -71.5375,
  },
  {
    name: "La Libertad",
    provinces: ["Trujillo", "Pacasmayo", "Ascope"],
    districts: ["Trujillo", "Víctor Larco Herrera", "Huanchaco", "La Esperanza"],
    lat: -8.1116,
    lng: -79.0287,
  },
  {
    name: "Piura",
    provinces: ["Piura", "Sullana", "Talara", "Paita"],
    districts: ["Piura", "Castilla", "Veintiséis de Octubre", "Talara"],
    lat: -5.1945,
    lng: -80.6328,
  },
  {
    name: "Cusco",
    provinces: ["Cusco", "Urubamba", "La Convención"],
    districts: ["Cusco", "Wanchaq", "San Sebastián", "Santiago"],
    lat: -13.5319,
    lng: -71.9675,
  },
  {
    name: "Lambayeque",
    provinces: ["Chiclayo", "Lambayeque", "Ferreñafe"],
    districts: ["Chiclayo", "José Leonardo Ortiz", "La Victoria", "Pimentel"],
    lat: -6.7714,
    lng: -79.8409,
  },
  {
    name: "Junín",
    provinces: ["Huancayo", "Tarma", "Chanchamayo"],
    districts: ["Huancayo", "El Tambo", "Chilca"],
    lat: -12.0651,
    lng: -75.2049,
  },
  {
    name: "Áncash",
    provinces: ["Huaraz", "Santa", "Huaylas"],
    districts: ["Huaraz", "Chimbote", "Nuevo Chimbote", "Independencia"],
    lat: -9.5261,
    lng: -77.5288,
  },
  {
    name: "Ica",
    provinces: ["Ica", "Chincha", "Pisco"],
    districts: ["Ica", "Chincha Alta", "Pisco", "Paracas"],
    lat: -14.0678,
    lng: -75.7286,
  },
  {
    name: "Cajamarca",
    provinces: ["Cajamarca", "Jaén", "Chota"],
    districts: ["Cajamarca", "Baños del Inca", "Jaén"],
    lat: -7.1617,
    lng: -78.5128,
  },
  {
    name: "Tacna",
    provinces: ["Tacna", "Jorge Basadre"],
    districts: ["Tacna", "Alto de la Alianza", "Gregorio Albarracín"],
    lat: -18.0066,
    lng: -70.2463,
  },
  {
    name: "Loreto",
    provinces: ["Maynas", "Alto Amazonas"],
    districts: ["Iquitos", "San Juan Bautista", "Punchana"],
    lat: -3.7437,
    lng: -73.2516,
  },
];

export const PERU_SECTORS = [
  "Tecnología y Software",
  "Banca, Finanzas y Seguros",
  "Minería y Energía",
  "Industria y Manufactura",
  "Retail y Consumo Masivo",
  "Telecomunicaciones",
  "Logística y Transporte",
  "Salud y Farmacéutica",
  "Educación y Capacitación",
  "Construcción e Ingeniería",
  "Agroindustria",
  "Turismo y Hotelería",
];

export function getDepartmentCoords(dept: string): { lat: number; lng: number } {
  const found = PERU_DEPARTMENTS.find(
    (d) => d.name.toLowerCase() === dept.toLowerCase()
  );
  return found ? { lat: found.lat, lng: found.lng } : { lat: -12.0464, lng: -77.0428 };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
