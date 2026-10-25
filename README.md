# 수능의 시간

수능의 교시별 시작 시각부터 실제 속도로 흐르는 아날로그 연습 시계입니다. 시계판 지름 30mm를 기준으로 화면별 크기 보정을 지원합니다.

```sh
npm install
npm run dev
```

`npm run build`로 정적 배포 파일을 `dist/`에 생성합니다. `npm test`로 시간 계산을 검증합니다.

배포 주소: https://hwanghj09.github.io/susi/

`main`에 push하면 GitHub Actions가 테스트와 빌드를 거쳐 GitHub Pages에 자동 배포합니다. Actions의 `Deploy to GitHub Pages`에서 수동 실행할 수도 있습니다. 저장소 Settings → Pages의 배포 소스는 `GitHub Actions`로 설정합니다.

디자인은 오래된 한지, 먹선, 쑥색과 작은 낙관을 바탕으로 구성했습니다. [UI-UX-Pro-Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)의 가독성과 터치 영역, [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)의 일관된 미술 방향, [shadcn/ui](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn)의 의미별 색상과 컴포넌트 원칙, [web-accessibility](https://www.skills.sh/supercent-io/skills-template/web-accessibility)의 키보드·대화상자 접근성, [web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines)의 반응형·동작 줄이기 지침을 적용합니다. shadcn의 원칙은 기존 HTML/CSS에 적용하며 React 컴포넌트는 사용하지 않습니다. 접근성 스킬은 원본 저장소가 없어 공개된 스킬 페이지의 사본을 참고했습니다.

- 국어, 수학, 영어, 한국사·탐구 1·2, 제2외국어·한문
- 시작·일시정지·초기화, Space 단축키, 시계 집중 모드(Esc로 종료)
- 초침 및 남은 시간 표시 설정, 로컬 저장 크기 보정
- 탭이 비활성화되어도 경과 시간을 실제 시각 기준으로 계산
- 지원 브라우저에서 연습 중 화면 꺼짐 방지

물리 크기는 기기와 브라우저 배율에 따라 달라지므로 자로 보정해야 합니다. 보정값은 현재 브라우저에 저장됩니다. 새로고침 시 연습은 초기화됩니다. 4교시는 쉬는 시간을 제외한 개별 시험을 선택합니다. 영어 듣기 음원과 감독관 안내는 포함하지 않습니다.
