import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { z } from 'zod';

// Validation schemas
const ParameterSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string(),
  examples: z.string().optional(),
  category_id: z.string().uuid(),
  parameter_type: z.enum(['narrative', 'guardrail']),
  global: z.boolean(),
  applicable_industries: z.record(z.boolean()).optional(),
  sort_order: z.number().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = ParameterSchema.parse(body);

    // If this is an industry override, ensure we're creating a new row
    if (!validatedData.global && validatedData.applicable_industries) {
      // Check if a global parameter exists with this name
      const existingGlobal = await sql`
        SELECT id FROM parameters 
        WHERE name = ${validatedData.name} 
        AND global = true
      `;

      if (existingGlobal.rows.length === 0) {
        return NextResponse.json(
          { error: 'Cannot create industry override without a global parameter' },
          { status: 400 }
        );
      }

      // Create new row for industry override
      const result = await sql`
        INSERT INTO parameters (
          name, description, examples, category_id, 
          parameter_type, global, applicable_industries, sort_order
        ) VALUES (
          ${validatedData.name},
          ${validatedData.description},
          ${validatedData.examples || null},
          ${validatedData.category_id},
          ${validatedData.parameter_type},
          false,
          ${JSON.stringify(validatedData.applicable_industries)},
          ${validatedData.sort_order || 0}
        )
        RETURNING *
      `;

      return NextResponse.json(result.rows[0]);
    }

    // For global parameters, check if one already exists
    const existing = await sql`
      SELECT id FROM parameters 
      WHERE name = ${validatedData.name} 
      AND global = true
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Global parameter with this name already exists' },
        { status: 400 }
      );
    }

    // Create new global parameter
    const result = await sql`
      INSERT INTO parameters (
        name, description, examples, category_id, 
        parameter_type, global, applicable_industries, sort_order
      ) VALUES (
        ${validatedData.name},
        ${validatedData.description},
        ${validatedData.examples || null},
        ${validatedData.category_id},
        ${validatedData.parameter_type},
        true,
        null,
        ${validatedData.sort_order || 0}
      )
      RETURNING *
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validatedData = ParameterSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { error: 'Parameter ID is required for updates' },
        { status: 400 }
      );
    }

    // For industry overrides, always create a new row
    if (!validatedData.global && validatedData.applicable_industries) {
      return POST(request);
    }

    // For global parameters, update the existing row
    const result = await sql`
      UPDATE parameters
      SET 
        description = ${validatedData.description},
        examples = ${validatedData.examples || null},
        category_id = ${validatedData.category_id},
        parameter_type = ${validatedData.parameter_type},
        sort_order = ${validatedData.sort_order || 0}
      WHERE id = ${validatedData.id}
      AND global = true
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Parameter not found or not a global parameter' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const industryId = searchParams.get('industryId');

    if (!id) {
      return NextResponse.json(
        { error: 'Parameter ID is required' },
        { status: 400 }
      );
    }

    // If deleting an industry override
    if (industryId) {
      const result = await sql`
        DELETE FROM parameters
        WHERE id = ${id}
        AND global = false
        AND applicable_industries ? ${industryId}
        RETURNING *
      `;

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Industry override not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // If deleting a global parameter, also delete all industry overrides
    const result = await sql`
      WITH deleted AS (
        DELETE FROM parameters
        WHERE id = ${id}
        AND global = true
        RETURNING *
      )
      DELETE FROM parameters
      WHERE name = (SELECT name FROM deleted)
      AND global = false
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Global parameter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 