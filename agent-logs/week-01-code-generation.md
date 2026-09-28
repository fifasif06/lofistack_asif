# Agent Log #1 (final)

WEEK 1 · AGENT LOG #1  
  
Kind: Code generation  
Agent: Claude (Cowork)  
Task: Build the LofiStack gallery site and both Week 1 components with an AI agent.  
Site: https://url.lofistack.com/preview/4jvzDvx4QbbGn6NMBAus  
  
Workflow:  
1. Gave the agent the rules up front instead of "make me a gallery": one list (registry.json) holds every component's name, type, week and link; each component lives in its own folder next to its final prompt; a small build script turns them into one paste-ready page per component. So the code and prompt shown on each page are always exactly what's in the folder.  
2. Had the agent build both components and save each final prompt beside its code.  
3. Made the agent test everything in a real browser: click through the pages, measure the button actually moving and settling back, watch the loader switch and replay, check phone size, check for script errors.  
4. Switched hosting mid-week from Vercel to GoHighLevel. Because of the folder setup, this meant rewriting two small files and the build script, not redoing the project. Every class is prefixed and every script guarded, so nothing clashes with GHL's own styles.  
5. Added an extra: a 5-second original lofi clip on the loader's play button, generated with the Web Audio API (the browser's built-in sound tools). The agent rendered it offline to check it never distorts (peak 0.895 of 1.0) and goes silent right at 5 seconds.  
  
What the agent caught that I would have missed:  
- The button's pull distance didn't match its hover zone, and a fix looked broken only because an old test server was still running. Found by measuring the button's real position, not by reading code.  
- The loader's round avatar was rendering square because two style rules fought each other. Obvious in a screenshot, invisible in the code.  
  
Result: 3 GHL pages (home + 2 components). Each component has its own direct link with live demo, full code and final prompt, and my details in the footer. Testing in a real browser stays in the loop for all 13 weeks.
