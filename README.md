# F1 Fantasy AI Advisor

An AI-powered tool built during a hackathon to help F1 Fantasy players optimize their team selections and maximize their points throughout the season.

## Demo Video

<div align="center">
  <p>
    <strong>
      <a href="https://www.loom.com/share/44537b7266a54be0a5488608fc1b5282?sid=1a060bb4-610f-487c-9cd5-79afdc995a79">
        🏎️ Watch the F1 Fantasy AI Advisor Demo 🏎️
      </a>
    </strong>
  </p>
  <p>
    <kbd>
      <a href="https://www.loom.com/share/44537b7266a54be0a5488608fc1b5282?sid=1a060bb4-610f-487c-9cd5-79afdc995a79">
        <img src="https://img.shields.io/badge/Watch_Demo-FF1E00?style=for-the-badge&logo=formula1&logoColor=white" alt="Watch Demo" />
      </a>
    </kbd>
  </p>
</div>

## About the Project

This project was a hackathon creation in March 2025 designed to see how far the state of the art of coding tools like Cursor and Lovable had come. These tools were used to build this application.

F1 Fantasy AI Advisor uses OpenAI's models to analyze driver and constructor performance data and provide personalized team recommendations based on budget constraints, recent performance metrics, and upcoming race conditions.

This project demonstrates how AI can be leveraged to provide data-driven insights and recommendations for fantasy sports.

## Features

- **AI-Powered Recommendations**: Get personalized team recommendations using advanced AI models
- **Budget Optimization**: Optimize your team selection while staying within budget constraints
- **Performance Analysis**: Analyze driver and constructor performance trends
- **Visual Team Comparisons**: Compare your current team with AI-recommended options
- **Markdown-Formatted Analysis**: Receive detailed explanations for recommendations in a readable format

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: PostgreSQL, Supabase, Drizzle ORM, Server Actions
- **AI**: OpenAI API with structured outputs
- **Authentication**: Clerk
- **Deployment**: Vercel

## Getting Started

First, create a `.env.local` file with the required environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_supabase_postgres_url
```

Then, run the development server:

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Data Sources

The app utilizes both historical and real-time F1 data to provide accurate recommendations:

- Driver performance metrics
- Constructor performance metrics
- Race results and statistics
- Current market values



## Acknowledgements

Special thanks to:

- OpenAI for providing the AI capabilities
- The F1 Fantasy community for inspiration
- All contributors to the open-source technologies used

