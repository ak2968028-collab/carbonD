export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: number;
  username: string;
  full_name: string | null;
}

export interface VillageSummary {
  vlcode: string;
  name: string;
  subdistrict_code: string | null;
  population_2011: number | null;
  has_carbon_data: boolean;
}

export interface VillagePage {
  total: number;
  items: VillageSummary[];
}

export interface CarbonBudget {
  total_emission_before: number | null;
  total_sequestration_before: number | null;
  net_emission_before: number | null;
  monthly_net_emission_before: number | null;
  per_capita_emission_before: number | null;
  previous_net_emission: number | null;
  net_emission_after: number | null;
  emission_reduction: number | null;
  sequestration_increase: number | null;
  total_impact: number | null;
  reduction_pct: number | null;
}

export interface EmissionSource {
  sector: string;
  source: string;
  emission_kg: number;
}

export interface Intervention {
  sector: string;
  name: string;
  reduction_kg: number;
}

export interface SequestrationItem {
  phase: "before" | "after";
  measure: string;
  area_ha: number | null;
  co2_kg: number;
}

export interface ScenarioPoint {
  scenario: string;
  year: number;
  emission_kg: number;
}

export interface Activity {
  activity: string;
  unit: string;
  value: number | null;
}

export interface VillageDetail extends VillageSummary {
  budget: CarbonBudget | null;
  emissions: EmissionSource[];
  interventions: Intervention[];
  sequestration: SequestrationItem[];
  scenarios: ScenarioPoint[];
  activities: Activity[];
}

export interface CensusProperties {
  vlcode: string;
  village: string;
  gram_panchayat: string | null;
  block: string | null;
  subdistrict: string | null;
  district: string | null;
  state: string | null;
  settlement_type: string | null;
  households: number | null;
  population: number | null;
  male: number | null;
  female: number | null;
  avg_household_size: number | null;
  area_ha: number | null;
  forest_area_ha: number | null;
  net_sown_area_ha: number | null;
  irrigated_area_ha: number | null;
  unirrigated_area_ha: number | null;
  barren_area_ha: number | null;
  culturable_waste_ha: number | null;
  current_fallow_ha: number | null;
  nearest_town: string | null;
  nearest_town_km: number | null;
}

export interface VillageBoundary {
  type: "Feature";
  id: string;
  geometry: GeoJSON.Geometry;
  properties: CensusProperties;
}

export interface SectorTotal {
  sector: string;
  emission_kg: number;
}

export interface CarbonSummary {
  villages_total: number;
  population_total: number;
  villages_assessed: number;
  total_emission_kg: number;
  total_sequestration_kg: number;
  net_emission_before_kg: number;
  net_emission_after_kg: number;
  emission_reduction_kg: number;
  sequestration_increase_kg: number;
  reduction_pct: number | null;
  by_sector: SectorTotal[];
}

export interface EmissionFactor {
  category: string;
  emission_factor: string;
  source: string | null;
}
