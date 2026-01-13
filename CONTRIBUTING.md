# Contributing to QuickQuack

Thank you for your interest in contributing to QuickQuack! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** first to avoid duplicates
2. If none exist, [create a new issue](https://github.com/jacobwoodward/jacobwoodward-dev/issues/new)
3. Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Screenshots if applicable

### Suggesting Features

1. [Open a discussion](https://github.com/jacobwoodward/jacobwoodward-dev/discussions) first
2. Describe the feature and why it would be useful
3. If there's community interest, it may become an issue

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push and open a PR

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)
- A Google Cloud account (for OAuth)

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/jacobwoodward-dev.git
cd jacobwoodward-dev

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your environment variables in .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000/setup` to verify your configuration.

### Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linter
npm run start    # Start production server
```

## Code Style

- **TypeScript**: All code should be properly typed (no `any` where avoidable)
- **Components**: Use functional components with hooks
- **Naming**: Use descriptive names, PascalCase for components, camelCase for functions
- **Formatting**: Code is auto-formatted on commit

### File Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components organized by feature
├── lib/           # Utilities, types, and integrations
```

### Patterns to Follow

- Server components by default, client components when interactivity needed
- Supabase queries in server components or API routes
- Use existing UI components from `src/components/ui/`
- Handle errors gracefully with user-friendly messages

## Testing Your Changes

Before submitting a PR:

1. Run the linter: `npm run lint`
2. Build the project: `npm run build`
3. Test the feature manually
4. Verify existing functionality still works

## Questions?

- **General questions**: [GitHub Discussions](https://github.com/jacobwoodward/jacobwoodward-dev/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/jacobwoodward/jacobwoodward-dev/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
