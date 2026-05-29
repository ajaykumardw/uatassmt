import { NextResponse } from "next/server";

const cache = new Map();

export async function POST(request: Request) {
  try {

    const body = await request.json();
    const key = `${body.pan}`;

    // Check cache
    if (cache.has(key)) {
        const cached = cache.get(key);
        const age = Date.now() - cached.timestamp;

        // cooldown 10 minutes
        if (age < 10 * 60 * 1000) {

            return NextResponse.json(cached.data);
        }
    }

    // const token = "0RpOs49PrgG2HGzzp8V5So5dAXerrW";

    const payload = {
        ...body,

        token: "0RpOs49PrgG2HGzzp8V5So5dAXerrW",
        first_name: body.first_name,
        last_name: body.last_name,
        id_type: "TaxId",
        id_number: body.pan,
        dob: body.dob,
        gender: "Male",
        phone: body.phone,
        email: body.email,
        street_address: body.street_address || "Jalandhar Cantt",
        city: body.city || "Jalandhar",
        postal_code: Number(body.postal_code) || 144005,
        region: body.region || "28",
        address_type: 1,
        legal_copy_status: "Accept",
        user_consent_data_share: true
    };

    // PayPrime API call
    const response = await fetch("https://b2b.payprime.in/api/cibil-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Save to cache
    cache.set(key, { data, timestamp: Date.now() });

    // Response
    return NextResponse.json(data);

  } catch (error) {

    console.error("Error generating CIBIL report:", error);

    return NextResponse.json(
      { status: false, message: "Failed to generate CIBIL report" },
      { status: 500 }
    );
  }
}
