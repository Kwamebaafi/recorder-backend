import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('voiceSample') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `recordings/${Date.now()}-${sanitizedName}`;

    // Uploads directly to Supabase storage bucket
    const { data, error } = await supabase.storage
      .from('uncompressed-voices')
      .upload(storagePath, buffer, {
        contentType: file.type || 'audio/m4a',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      path: data.path,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}