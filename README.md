# Grizzly-Hacks-II

## Inspiration
As people who grew up with a language other than English as our first language, we have experienced the difficulties and frustrations of not being understood. Not only did this barrier cause frustration, but it also created a loss of confidence. 11 million Americans today are classified as deaf; think about how this affects their confidence and ability to express themselves. They face a significant barrier when communicating their feelings and thoughts with the people they interact with on a daily basis. Our inspiration stems from those who are stuck in a language barrier because there is no affordable solution for their voices to be heard. 

## What it does
The website has a camera which tracks hand movement for sign letters and saves the letter to create full words. Family members of those who have gotten diagnosed with deafness can support their family members by also gradually learning sign language using the top words used. This website keeps record of the most common/significant words used and can be seeked back to actually learn the sign for it. Instead of relying on expensive technologies this website provides an easy solution to ease into the world of sign language. 

## How we built it
We built the core of our application around MediaPipe's Gesture Recognizer (v0.10.3), integrating its GestureRecognizer and FilesetResolver to process hand gestures in real time directly through the browser. Using the LIVE_STREAM mode with GPU acceleration, our script.js continuously captures video frames from the user's webcam, extracts gesture names and confidence scores, and renders hand skeleton overlays onto a canvas element using DrawingUtils, drawing landmark connections and joint points frame by frame. On the backend, we used Flask to serve the application and handle routing between pages. We also built a Translation History page that logs recognized signs over time and gives users the ability to review or clear their history, laying the groundwork for the word-tracking and learning features central to our project's mission.

## Challenges we ran into
One of the core issues that we ran into is that the dataset for the ASL language model was quite large, making it very time consuming to download and also spacious in our precious computer space. For this reason, we selected around 250 common words in addition to all the letters of the alphabet. Furthermore, another issue we faced was that the model had a hard time picking up letters and the person needs to make extremely clear hand signs for a few seconds before it picks up. However, we would need to input a lot more images for the model to more accurately pick up the sign language. 

## Accomplishments that we're proud of
We are really proud that we were able to get real-time hand gesture recognition actually working in the browser. We are also proud that this is genuinely a design which could help aid deaf people and help them connect with loved ones. We are also proud of how we managed our time and the way we worked as a team to get through challenges and also building off each other's ideas. 
                                           
## What we learned
Working with MediaPipe was honestly something none of us had done before, so figuring out how gesture recognition models work, from landmark detection to confidence scoring, was a big learning curve. We got a much better understanding of how image and video processing works in real time, and how the browser breaks down live footage frame by frame to actually detect hand positions. Connecting a pre-trained AI model to a real web application taught us that machine learning is not just a concept, it is something you can actually build with and use to solve real problems for real people. We also learned the hard way that working with large datasets is not as straightforward as it sounds, and finding ways to optimize and cut down file sizes just to keep things running was a lesson in itself.

## What's next for Signify
The next steps for Signify is to get a larger ASL language dataset and also make sure that the model is extremely well trained on tracking the hand gestures of people to ensure the smoothest translation. In the future there will also be a greater emphasis on the learning aspect of the website; it would use scientifically backed up methods for learning like spaced repetition in order to ensure that the people are actually learning the language instead of just relying on a website. We also want to expand Signify beyond just the browser and explore making it available as a
mobile app, so that it can be used anywhere and reach even more families who need it. Also our hopes were that it could allow the person who doesn’t know how to perform sign language to voice record or type onto the website and after it would display the words in sign language.


What languages, frameworks, platforms, cloud services, databases, APIs, or other technologies did you use?
HTML, CCS, JavaScript, Python, Flask, MediaPipe Vision Tasks v0.10.3, Browser Canvas API, getUserMedia, requestAnimationFrame, Google Fonts, gesture_recognizer.task

Try Out Link: https://aaditya-shinde.github.io/Grizzly-Hacks-II/index.html







