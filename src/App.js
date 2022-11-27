import React from "react";
import Title from "./components/Title";

const jsonLocalStorage = {
  setItem: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getItem: (key) => {
    return JSON.parse(localStorage.getItem(key));
  },
};

const fetchCat = async (text) => {
  const OPEN_API_DOMAIN = "https://cataas.com";
  const response = await fetch(`${OPEN_API_DOMAIN}/cat/says/${text}?json=true`);
  const responseJson = await response.json();
  return `${OPEN_API_DOMAIN}/${responseJson.url}`;
};

function CatItem(props) {
  return (
    <li>
      <img src={props.img} style={{ width: "150px" }} />
    </li>
  );
}

// {return ()}에서 중괄호없이 작성시 바로 리턴한 것과 같은 효과 있음
const Form = ({ updateMainCat }) => {
  // 한글 입력 금지
  const includesHangul = (text) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/i.test(text);
  const [value, setValue] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  function handleInputChange(e) {
    const userValue = e.target.value;
    console.log(includesHangul(userValue));
    if (includesHangul(userValue)) {
      setErrorMessage("한글은 입력할 수 없습니다");
    } else {
      // 초기화 과정이 필요함. 안그러면 원래값 그대로 남음
      setErrorMessage("");
    }
    setValue(userValue.toUpperCase());

    // console.log(e);v
    // console.log(e.target.nodeName);
    // console.log(e.target.value.toUpperCase());
    // setValue(e.target.value.toUpperCase());
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    // else 대신에 무조건 초기화 후 조건문을 쓸 수도 있음
    setErrorMessage("");

    if (value === "") {
      setErrorMessage("빈 값으로 만들 수 없습니다.");
      return; // 여기서 끝날 수 있게
    }
    updateMainCat(value);
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <input
        type="text"
        name="name"
        placeholder="영어 대사를 입력해주세요"
        onChange={handleInputChange}
        value={value}
      />
      <button type="submit">생성</button>
      <p style={{ color: "red" }}>{errorMessage}</p>
    </form>
  );
};

function Favorites({ favorites }) {
  if (favorites.length === 0) {
    return <div>사진 위 하트를 눌러 고양이 사진을 저장해보세요</div>;
  }

  return (
    <ul className="favorites">
      {favorites.map((cat) => (
        <CatItem img={cat} key={cat} />
      ))}
    </ul>
  );
}

const MainCard = ({ img, onHeartClick, alreadyFavorite }) => {
  const heartIcon = alreadyFavorite ? "💖" : "🤍";
  return (
    <div className="main-card">
      <img src={img} alt="고양이" width="400" />
      <button onClick={onHeartClick}>{heartIcon}</button>
    </div>
  );
};

const App = () => {
  const CAT1 = "https://cataas.com/cat/HSENVDU4ZMqy7KQ0/says/react";

  const [counter, setCounter] = React.useState(() => {
    return jsonLocalStorage.getItem("counter");
  });
  const [mainCat, setMainCat] = React.useState(CAT1);
  const [favorites, setFavorites] = React.useState(() => {
    // 초기값을 로컬스토리지에서 불러오는데 로컬에 favorites 데이터가 없기 때문에 생기는 에러. 없을 때를 대비한 빈 배열의 값을 적어 줌.
    // 앞에게 없으면 뒤의 것을 써라.
    return jsonLocalStorage.getItem("favorites") || [];
  });

  // .includes() 자바스크립트. 배열안에 있는지 확인
  const alreadyFavorite = favorites.includes(mainCat);

  async function setInitialCat() {
    const newCat = await fetchCat("first cat");
    setMainCat(newCat);
  }

  // UI가 새로 그려질때마다(업데이트 될때마다) 콘솔 로그가 찍히는데 내가 원할 때만 업데이트가 되게끔 하려 사용
  React.useEffect(() => {
    setInitialCat();
  }, []); // 빈 배열을 넣으면 컴포넌트가 처음 불려와질 때만 실행

  async function updateMainCat(value) {
    // 데이터를 제대로 받아오기 위해서는 await를 작성해야 하며 상위 함수가 꼭 async 키워드 작성되어야 함
    const newCat = await fetchCat(value);

    setMainCat(newCat);

    setCounter((prev) => {
      const nextCounter = prev + 1;
      jsonLocalStorage.setItem("counter", nextCounter);
      return nextCounter;
    });
  }

  function handleHeartClick() {
    console.log("하트 누름");
    const nextFavorites = [...favorites, mainCat];
    setFavorites(nextFavorites);
    jsonLocalStorage.setItem("favorites", nextFavorites);
  }

  const counterTitle = counter === null ? "" : counter + "번째 ";

  return (
    <div>
      {/* 이렇게 작성하면 children으로 props가 들어감 */}
      <Title>{counterTitle} 고양이</Title>
      <Form updateMainCat={updateMainCat} />
      <MainCard
        img={mainCat}
        onHeartClick={handleHeartClick}
        alreadyFavorite={alreadyFavorite}
      />
      <Favorites favorites={favorites} />
    </div>
  );
};

export default App;
