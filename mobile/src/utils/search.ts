import { PropertyListing, SearchFilters } from '../types';

export const formatCurrency = (value: number, currency: string) => {
  const symbol = currency === 'USD' ? '$' : currency === 'KES' ? 'KSh ' : '';
  return `${symbol}${value.toLocaleString()}`;
};

export const buildSearchSummary = (filters: SearchFilters) => {
  const parts: string[] = [];
  if (filters.city) parts.push(filters.city);
  if (filters.neighborhood) parts.push(filters.neighborhood);
  if (filters.radiusKm) parts.push(`${filters.radiusKm} km`);
  if (filters.priceMin || filters.priceMax) {
    parts.push(`${filters.priceMin || 'Any'} - ${filters.priceMax || 'Any'} ${filters.currency}`);
  }
  if (filters.bedrooms.length) parts.push(`${filters.bedrooms.join(', ')} bd`);
  if (filters.propertyTypes.length) parts.push(filters.propertyTypes.join(', '));
  return parts.length ? parts.join(' · ') : 'All properties';
};

export const matchesFilters = (property: PropertyListing, filters: SearchFilters) => {
  if (filters.city && property.city.toLowerCase() !== filters.city.toLowerCase()) return false;
  if (
    filters.neighborhood &&
    property.neighborhood.toLowerCase() !== filters.neighborhood.toLowerCase()
  ) {
    return false;
  }
  if (filters.priceMin && property.price < Number(filters.priceMin)) return false;
  if (filters.priceMax && property.price > Number(filters.priceMax)) return false;
  if (filters.bedrooms.length) {
    const matchesBedroom = filters.bedrooms.some((value) => {
      if (value === 'studio') return property.bedrooms === 0;
      if (value === '4+') return property.bedrooms >= 4;
      return property.bedrooms === Number(value);
    });
    if (!matchesBedroom) return false;
  }
  if (filters.bathrooms.length) {
    const matchesBath = filters.bathrooms.some((value) => {
      if (value === '3+') return property.bathrooms >= 3;
      return property.bathrooms === Number(value);
    });
    if (!matchesBath) return false;
  }
  if (filters.propertyTypes.length && !filters.propertyTypes.includes(property.type)) {
    return false;
  }
  if (filters.sqftMin && property.sqft < Number(filters.sqftMin)) return false;
  if (filters.sqftMax && property.sqft > Number(filters.sqftMax)) return false;
  if (filters.availableNow) {
    const availableDate = new Date(property.availableDate);
    if (availableDate > new Date()) return false;
  }
  if (filters.availableWithinDays) {
    const availableDate = new Date(property.availableDate);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + filters.availableWithinDays);
    if (availableDate > maxDate) return false;
  }
  if (filters.amenities.length) {
    const hasAllAmenities = filters.amenities.every((amenity) =>
      property.amenities.includes(amenity)
    );
    if (!hasAllAmenities) return false;
  }
  return true;
};
