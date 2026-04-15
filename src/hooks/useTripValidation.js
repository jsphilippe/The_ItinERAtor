// useTripValidation.js
// Custom React hook for validating trip itineraries against a dataset of flights.
// Provides functions to check the validity of one-way, round-trip, and multi-city itineraries based on date ordering and flight existence rules.

export default function useTripValidation(flights) {
  // -----------------------------
  // Basic date ordering rule
  // -----------------------------
  const isValidDateOrder = (depart, ret) => {
    if (!depart || !ret) return true;
    return new Date(ret) >= new Date(depart);
  };

  // -----------------------------
  // Check if a single flight exists in dataset
  // -----------------------------
  const flightExists = (origin, destination, date) => {
    if (!origin || !destination || !date) return false;

    return flights.some(
      f =>
        f.origin === origin &&
        f.destination === destination &&
        f.departDate === date
    );
  };

  // -----------------------------
  // Validate one-way trip
  // -----------------------------
  const validateOneWay = (form) => {
    return (
      !!form.origin &&
      !!form.destination &&
      !!form.departDate &&
      flightExists(form.origin, form.destination, form.departDate)
    );
  };

  // -----------------------------
  // Validate round-trip
  // -----------------------------
  const validateRoundTrip = (form) => {
    if (
      !form.origin ||
      !form.destination ||
      !form.departDate ||
      !form.returnDate
    ) {
      return false;
    }

    if (!isValidDateOrder(form.departDate, form.returnDate)) {
      return false;
    }

    const outboundValid = flightExists(
      form.origin,
      form.destination,
      form.departDate
    );

    const inboundValid = flightExists(
      form.destination,
      form.origin,
      form.returnDate
    );

    return outboundValid && inboundValid;
  };

  // -----------------------------
  // Validate multi-city
  // -----------------------------
  const isValidMultiCityOrder = (legs) => {
    if (!legs || legs.length === 0) return false;

    // Ensure all legs exist in dataset
    const allLegsExist = legs.every(
      leg =>
        leg.origin &&
        leg.destination &&
        leg.departDate &&
        flightExists(leg.origin, leg.destination, leg.departDate)
    );

    if (!allLegsExist) return false;

    // Prevent immediate logical reversal between consecutive legs
    for (let i = 1; i < legs.length; i++) {
      const prev = legs[i - 1];
      const curr = legs[i];

      if (
        prev.origin === curr.destination &&
        prev.destination === curr.origin
      ) {
        return false;
      }
    }

    return true;
  };

  const validateMultiCity = (form) => {
    return isValidMultiCityOrder(form.legs);
  };

  // -----------------------------
  // Unified validator (recommended entry point)
  // -----------------------------
  const validateTrip = (tripType, form) => {
    switch (tripType) {
      case "oneWay":
        return validateOneWay(form);

      case "roundTrip":
        return validateRoundTrip(form);

      case "multiCity":
        return validateMultiCity(form);

      default:
        return false;
    }
  };

  // -----------------------------
  // Export API
  // -----------------------------
  return {
    isValidDateOrder,
    flightExists,
    validateOneWay,
    validateRoundTrip,
    validateMultiCity,
    validateTrip
  };
}
