# Contributing to TrustOS

Thank you for contributing to TrustOS. Your contributions help build an open, accessible, privacy-first security layer for digital education and enterprise environments.

## How Can I Contribute?

### Reporting Bugs
Bugs are tracked as GitHub issues. When filing an issue, please provide:
* A concise and descriptive title.
* Clear steps to reproduce the issue.
* Expected behavior vs. actual behavior observed.
* Browser version (Chrome, Edge, Brave) and operating system.
* Relevant console logs or threat diagnostic export JSON.

### Suggesting Heuristic & Architectural Enhancements
Enhancement suggestions are welcome:
* Describe the phishing attack vector or threat pattern being targeted.
* Explain the heuristic algorithm or edge detection methodology.
* Ensure proposals adhere strictly to our Zero-Transmission privacy guarantee (no cloud API dependencies).

### Pull Request Workflow
1. Fork the repository and create your branch from `main`.
2. Follow Vanilla JavaScript conventions and modular design principles.
3. Add or update unit tests in `tests/unit_tests.js`.
4. Run the automated test suite (`node tests/node_test_runner.js` or open `tests/test_runner.html`) to ensure all tests pass.
5. Verify that no emojis are present in code, commit messages, or documentation.
6. Submit your pull request with a descriptive summary of changes.

By contributing to TrustOS, you agree that your contributions will be licensed under the project's MIT License.
