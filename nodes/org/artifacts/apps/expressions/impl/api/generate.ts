export const config = {
  runtime: "edge",
};

// Type declaration for edge runtime environment
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

interface Profile {
  register: string;
  sacred: string;
  mode: string;
  influences: string;
}

interface RequestBody {
  artifact: string;
  profile: Profile;
  category?: string;
}

interface ClaudeResponse {
  content: { text: string }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/tbutler1132/vital-systems/main/nodes/org/artifacts";

async function fetchArtifactContent(
  artifactId: string,
  category: string = "core"
): Promise<{ about: string; notes: string }> {
  const [aboutRes, notesRes] = await Promise.all([
    fetch(`${GITHUB_RAW_BASE}/${category}/${artifactId}/about.md`),
    fetch(`${GITHUB_RAW_BASE}/${category}/${artifactId}/notes.md`),
  ]);

  if (!aboutRes.ok || !notesRes.ok) {
    throw new Error("Failed to fetch artifact content");
  }

  const about = await aboutRes.text();
  const notes = await notesRes.text();

  return { about, notes };
}

function buildPrompt(about: string, notes: string, profile: Profile): string {
  return `You are generating a personalized expression of a philosophical artifact.

## The Concept (authoritative)
${about}

## Working Material (substance to draw from)
${notes}

## Reader Profile
- Prefers: ${profile.register}
- Sacred orientation: ${profile.sacred}
- Drawn to: ${profile.mode}
- Influences: ${profile.influences}

Generate a ~600-word personalized expression of this artifact for this reader. 
Shape the presentation, examples, and emphasis to resonate with their specific sensibility. 
The core truth remains — only the presentation adapts.

Write in second person where appropriate. Be direct, not preachy. 
This is a gift, not a lecture.`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const {
      artifact,
      profile,
      category = "core",
    } = (await req.json()) as RequestBody;

    if (!artifact || !profile) {
      return new Response(
        JSON.stringify({ error: "Missing artifact or profile" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch artifact content from GitHub
    const { about, notes } = await fetchArtifactContent(artifact, category);

    // Build prompt
    const prompt = buildPrompt(about, notes, profile);

    // Call Claude API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const error = await anthropicRes.text();
      console.error("Claude API error:", error);
      throw new Error("Claude API call failed");
    }

    const claudeData = (await anthropicRes.json()) as ClaudeResponse;
    const expression = claudeData.content[0].text;
    const { input_tokens, output_tokens } = claudeData.usage;

    return new Response(
      JSON.stringify({
        expression,
        about,
        notes,
        usage: { input_tokens, output_tokens },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate expression" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
