# F1 Fantasy AI Advisor

An AI-powered tool built during a hackathon to help F1 Fantasy players optimize their team selections and maximize their points throughout the season.

## About the Project

F1 Fantasy AI Advisor uses OpenAI's models to analyze driver and constructor performance data and provide personalized team recommendations based on budget constraints, recent performance metrics, and upcoming race conditions.

This project was developed as part of a hackathon to explore the potential of AI in enhancing the F1 Fantasy experience. It demonstrates how AI can be leveraged to provide data-driven insights and recommendations for fantasy sports.

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

## Future Enhancements

Future improvements planned for the project:

- Real-time data integration with official F1 API
- Machine learning model for predictive performance analysis
- Mobile app version
- Social sharing of team selections
- Head-to-head team comparisons

## Acknowledgements

This project was created during a hackathon by a team of F1 enthusiasts. Special thanks to:

- OpenAI for providing the AI capabilities
- The F1 Fantasy community for inspiration
- All contributors to the open-source technologies used

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
