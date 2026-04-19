// useTripValidation.js
//
// Custom React hook for validating itinerary submissions against the
// underlying flight dataset.
//
// This module defines what constitutes a *valid* itinerary in the experiment.
// Importantly, all validation rules are data-driven and derived from actual
// flight availability rather than abstract or hard-coded constraints.
//
// Validation logic is shared across System A and System B so that behavioral
// differences arise from interface design and constraint exposure, not from
// differences in correctness criteria.

export default function useTripValidation(flights) {
  // -----------------------------
  // Basic date ordering rule
  // -----------------------------
  // Ensures temporal consistency for itineraries that include a return leg.
  // This rule encodes a fundamental constraint without prescribing any
  // particular solution or date choice.
  const isValidDateOrder = (depart, ret) => {
    if (!depart || !ret) return true;
    return new Date(ret) >= new Date(depart);
  };

  // -----------------------------
  // Check if a single flight exists in dataset
  // -----------------------------
  // Determines whether a specific origin–destination–date combination
  // corresponds to at least one concrete flight instance.
  //
  // This function is the atomic validation primitive used by all itinerary
  // types. It guarantees that validity is grounded in the dataset rather
  // than inferred from heuristics or ranges.
  const flightExists = (origin, destination, date) => {
    if (!origin || !destination || !date) return false;

    return flights.some(
      (f) =>
        f.origin === origin &&
        f.destination === destination &&
        f.departDate === date
    );
  };

  // -----------------------------
  // Validate one-way trip
  // -----------------------------
  // A one-way itinerary is valid if all required fields are present
  // and at least one matching flight exists for the selected parameters.
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
  // A round-trip itinerary is valid if:
  // - all required fields are present
  // - temporal ordering is respected
  // - both outbound and return legs exist independently in the dataset
  //
  // This explicitly encodes asymmetric route availability, which is a key
  // source of difficulty in the flexible interface.
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
  // Multi-city itineraries introduce ordering and continuity constraints
  // across a sequence of legs.
  //
  // Validation requires that:
  // - at least one leg exists
  // - every leg corresponds to an actual flight
  // - consecutive legs do not form immediate logical reversals
  //
  // These rules preserve realism while preventing trivial cycles that
  // obscure more meaningful constraint reasoning.
  const isValidMultiCityOrder = (legs) => {
    if (!legs || legs.length === 0) return false;

    // Ensure all legs exist in dataset
    const allLegsExist = legs.every(
      (leg) =>
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
  // Unified validator
  // -----------------------------
  // Provides a single entry point for itinerary validation, ensuring that
  // all systems evaluate correctness using identical rules.
  //
  // This function is used by both System A (post-submission validation)
  // and System B (pre-selection filtering), guaranteeing parity between
  // reactive and proactive constraint handling.
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
  // Exposes both low-level primitives and a unified validation entry point.
  //
  // The individual helpers are exported for transparency, testing, and
  // potential analytical reuse, but `validateTrip` is the recommended
  // integration point for application logic.
  //
  // By sharing this API across System A and System B, the application
  // guarantees that all notions of correctness are centralized, consistent,
  // and derived from the same data-driven rules, regardless of whether
  // constraints are enforced proactively or evaluated after submission.
  return {
    isValidDateOrder,
    flightExists,
    validateOneWay,
    validateRoundTrip,
    validateMultiCity,
    validateTrip,
  };
}