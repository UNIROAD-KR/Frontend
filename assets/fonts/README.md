# Pretendard

Official Pretendard v1.3.9 assets from https://github.com/orioncactus/pretendard/tree/v1.3.9/packages/pretendard/dist
Distributed under SIL Open Font License 1.1; see LICENSE.txt.

- Web: PretendardVariable.ttf, with a declared 100–900 weight range.
- iOS/Android: static OTF faces, selected by the existing fontWeight styles for consistent native rendering.
- Fonts load before the root screen renders. A loading error is logged and allows system-font fallback rather than leaving the splash screen stuck.

Import Text and TextInput from `@/components/ui/app-text` in app screens. Existing styles (including `fonts` from constants/theme) can be used unchanged. The wrappers preserve refs, nested text weight inheritance, and explicit custom font families. Third-party icons keep their own font.
