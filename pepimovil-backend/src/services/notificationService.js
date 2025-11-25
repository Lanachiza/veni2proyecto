export async function notifyDriverAssignment(driver, trip) {
  console.log(`Notify driver ${driver.id}: assigned to trip ${trip.id}`);
  return { ok: true };
}

