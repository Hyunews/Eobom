# test-audio/ — STT 개발용 임시 음성 디렉토리

CLOVA Speech 연동(`sttController.ts`) 개발·회귀 확인 때 쓰는 짧은 음성 샘플(m4a·mp3·wav)을
여기 두고 쓴다. 재생성 가능한 데이터라 **커밋하지 않는다**(`.gitignore`) — 이 프로젝트는
음성 파일 자체를 보관하지 않기로 했다(`06-05` §5.1, `sttController.ts`의 memoryStorage 원칙과
동일 이유).

- 파일을 넣고 지우는 것은 자유. 커밋 대상이 아니므로 git 상태에 안 잡힌다.
- 이 디렉토리 자체(`.gitkeep`)와 이 `README.md`만 저장소에 남는다.
