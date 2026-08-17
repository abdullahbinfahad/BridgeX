export const BANGLADESH_DISTRICTS = [
  "Barishal", "Bhola", "Bogura", "Brahmanbaria", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla",
  "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gazipur", "Gopalganj", "Jashore", "Khulna", "Kishoreganj",
  "Kurigram", "Kushtia", "Lakshmipur", "Madaripur", "Mymensingh", "Naogaon", "Narayanganj", "Narsingdi",
  "Noakhali", "Pabna", "Patuakhali", "Rajshahi", "Rangpur", "Satkhira", "Sylhet", "Tangail",
] as const;

export const BANGLADESH_CITIES_BY_DISTRICT: Record<string, string[]> = {
  Barishal: ["Barishal City", "Bakerganj", "Banaripara", "Mehendiganj"],
  Bhola: ["Bhola Sadar", "Char Fasson", "Lalmohan", "Manpura"],
  Bogura: ["Bogura Sadar", "Sherpur", "Shibganj", "Nandigram"],
  Brahmanbaria: ["Brahmanbaria Sadar", "Ashuganj", "Akhaura", "Nabinagar"],
  Chattogram: ["Chattogram City", "Patiya", "Hathazari", "Sitakunda"],
  Chuadanga: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
  "Cox's Bazar": ["Cox's Bazar Sadar", "Teknaf", "Ramu", "Chakaria"],
  Cumilla: ["Cumilla City", "Daudkandi", "Chandina", "Muradnagar"],
  Dhaka: ["Dhaka City", "Dhanmondi", "Mirpur", "Uttara", "Savar"],
  Dinajpur: ["Dinajpur Sadar", "Birampur", "Parbatipur", "Phulbari"],
  Faridpur: ["Faridpur Sadar", "Bhanga", "Boalmari", "Nagarkanda"],
  Feni: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Sonagazi"],
  Gazipur: ["Gazipur City", "Tongi", "Kaliakair", "Sreepur"],
  Gopalganj: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Tungipara"],
  Jashore: ["Jashore Sadar", "Jhikargacha", "Keshabpur", "Manirampur"],
  Khulna: ["Khulna City", "Daulatpur", "Dumuria", "Paikgacha"],
  Kishoreganj: ["Kishoreganj Sadar", "Bhairab", "Hossainpur", "Pakundia"],
  Kurigram: ["Kurigram Sadar", "Ulipur", "Nageshwari", "Rajarhat"],
  Kushtia: ["Kushtia Sadar", "Bheramara", "Kumarkhali", "Mirpur"],
  Lakshmipur: ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati"],
  Madaripur: ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar"],
  Mymensingh: ["Mymensingh City", "Trishal", "Muktagacha", "Bhaluka"],
  Naogaon: ["Naogaon Sadar", "Atrai", "Manda", "Patnitala"],
  Narayanganj: ["Narayanganj City", "Rupganj", "Sonargaon", "Araihazar"],
  Narsingdi: ["Narsingdi Sadar", "Madhabdi", "Raipura", "Belabo"],
  Noakhali: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Hatiya"],
  Pabna: ["Pabna Sadar", "Ishwardi", "Bera", "Santhia"],
  Patuakhali: ["Patuakhali Sadar", "Kuakata", "Bauphal", "Galachipa"],
  Rajshahi: ["Rajshahi City", "Paba", "Bagha", "Charghat"],
  Rangpur: ["Rangpur City", "Badarganj", "Mithapukur", "Pirganj"],
  Satkhira: ["Satkhira Sadar", "Kalaroa", "Shyamnagar", "Tala"],
  Sylhet: ["Sylhet City", "Beanibazar", "Golapganj", "Jaintiapur"],
  Tangail: ["Tangail Sadar", "Mirzapur", "Sakhipur", "Madhupur"],
};

export function citiesForDistrict(district: string) {
  return BANGLADESH_CITIES_BY_DISTRICT[district] ?? [`${district} Sadar`];
}

export type EscrowStage = "offer_accepted" | "funded" | "purchased" | "in_transit" | "delivered" | "released" | "disputed";

const stageOrder: EscrowStage[] = ["offer_accepted", "funded", "purchased", "in_transit", "delivered", "released"];

export function canAdvanceEscrowStage(from: EscrowStage, to: EscrowStage) {
  if (to === "disputed") return from !== "released";
  if (from === "disputed") return false;
  return stageOrder.indexOf(to) === stageOrder.indexOf(from) + 1;
}
