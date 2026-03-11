# Music Player

The Music Player is a central audio management system that allows pilots to curate their auditory environment while navigating the Neon Survivor sector.

## BPM Folders
Music is organized into specialized folders based on Beats Per Minute (BPM):
- **80 BPM**: Low-intensity synchronization, suitable for tactical evaluation.
- **100 BPM**: Standard operational rhythm.
- **120 BPM**: High-performance combat synchronization.
- **140 BPM**: Acceleration threshold, intense energetic output.
- **160 BPM**: Maximum overdrive, rapid reflex engagement.

## Continuous Playback
The audio system is decoupled from arena environmental data. Music continues to play uninterrupted regardless of sector transitions, extraction requests, or teleportation events. This ensures sustained focus and acoustic immersion.

## Playback Controls
- **Skip Track**: Pilots can navigate the current selected BPM playlist.
- **Track Like Protocol**: Individual tracks can be "liked." This status is persisted in the local system database.
- **Liked Only Mode**: A filter that restricts playback exclusively to previously liked tracks.
- **Progress Monitoring**: Real-time visualization of track progress and total duration.

## Single Source Protocol
The system enforces a strict single-source rule to maintain acoustic clarity. Activating any track from the playlist automatically terminates any currently playing audio streams, including menu soundtracks. This synchronization ensures that auditory signals never overlap, maintaining tactical immersion. Selecting a new track manually also triggers immediate playback, effectively overriding pause states or menu music protocols.

## UI Interface
The Music Player is integrated into the System Settings via a dedicated PLAYLIST tab. The interface utilizes a 4-column tactical layout:
- **BPM LINKS**: On the far left, pilots can select between available BPM synchronization folders.
- **SECTOR TRACKS**: The second column displays all available audio streams within the selected BPM folder.
- **SPACESHIP PILOT PANEL**: A central high-fidelity console featuring a real-time waveform display, track metadata, progress indicators, and core playback controls (Play/Pause, Skip, Like).
- **VERTICAL AMPLITUDE SLIDERS**: On the far right, dual vertical sliders allow for precision adjustment of MUSIC and SOUND volumes with real-time percentage feedback.
