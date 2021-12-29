const input = document.getElementById('input')
const simulateBtn = document.getElementById('simulateBtn')
const totalBTC = document.getElementById('totalBTC')
const logger = document.getElementById('logger')

//poczatkowa ilosc BTC w grze
let availableBTC = 10.0

//tablica logow:
const logArray = []

//   ===================================================================
//   OBIEKTY PODSTAWOWE, SLUZACE DO WYKONANIA ANALIZ
//   ===================================================================  

// glowny obiekt definiujacy strategie - zmieniany TYLKO RECZNIE przy 
// testowaniu roznych strategii.
// Okresla za jaki procent calej puli wchodzimy w rynek i co ile % spadku od topa
// sa poziomy wejscia. Czyli w bazowej strategii mamy rowne procenty puli dla 
// kazdego poziomu, pierwszy poziom na -15% od szczytu i kolejne co 5% w dol:
//ten obiekt pomocniczy moze byc np 2D-arrayem:
const STRATEGY_ENTRIES = [
    [85, 10], //10 puli po 10%. pierwsze wejscie jak cena osiagnie 85% topa.
    [80, 10],
    [75, 10],
    [70, 10],
    [65, 10],
    [60, 10],
    [55, 10],
    [50, 10],
    [45, 10],
    [40, 10]
]

//globalny obiekt pomocniczy osobny dla kazdej gieldy 
// zawiera dane na temat ostatniej i aktualnej ceny,
//aktualnego topa, ostatniego punktu na ktorym był zakup i jak duzy byl zakup.
const CURRENT_BINANCE_DATA = { 
    previousPrice: 39.7,
    currentPrice: 39.5,
    currentTop: 44.5,
    lastBuyAt: 40.0,
    lastBoughtAmount: 0.2
}

//ten obiekt pomocniczy trzyma dane o poziomach wejscia dla aktualnego topa.
let  ENTRY_POINTS_FOR_CURRENT_TOP = []
// ALTERNATYWNIE:
//ten obiekt pomocniczy moze byc tez tablica po prostu, 
// byc moze tak bedzie wygodniej po nim iterowac sprawdzajac 
// czy cena przekroczyla jakis poziom:
// ENTRY_POINTS_FOR_CURRENT_TOP = [ 40000, 38000, 36000]
  

  
//tablica zawierajaca dane o aktualnych zakupach. Mozna rozwazyc osobna
// tabele w DB ktora trzyma te same dane wrazie wu jakby z jakiegos powodu
// skrypt sie wy738al na ryj i utracil dane z pamieci podrecznej.
  let ACTIVE_TRADES = [
    {
      where: 'binance',
      workerID: 'druhmachinaBinance',
      ticker: 'BTCUSDC',
      boughtAt: 42,
      sellBackAt: 43.5, //obliczone po jakiej kwocie ma sprzedac z zyskiem
      amount: 0.2
    },
   
    
  ]

//   ===================================================================
//   TRZY FUNKCJE PODSTAWOWE, ANALITYCZNE:
//   ===================================================================  

  function setPreviousPriceAndCurrentPrice(newPrice){
    //superprosta funkcja
    //ustawia poprawnie ceny - poprzednia (z poprzedniej aktualnej) 
    // i aktualna (z najnowszego alertu)
    CURRENT_BINANCE_DATA.previousPrice = CURRENT_BINANCE_DATA.currentPrice
    CURRENT_BINANCE_DATA.currentPrice = newPrice
  
  }
  
  function checkForNewTop(){
    //tutej bardziej zawila logika warunkowa - 
    // analizuje wg jakichs kryteriow czy ustawic nowy top czy nie.
    //jesli tak to currentTop zmienia sie na wartosc najnowszej ceny.
    //wtedy nalezy ustawic NOWE PROGI WEJSCIA - setNewEntryPoints(newTop).
    if(CURRENT_BINANCE_DATA.previousPrice < CURRENT_BINANCE_DATA.currentPrice){
      CURRENT_BINANCE_DATA.currentTop = CURRENT_BINANCE_DATA.currentPrice
      setNewEntryPoints(CURRENT_BINANCE_DATA.currentTop)
    }
    console.log(CURRENT_BINANCE_DATA);
  }

  function setNewEntryPoints(newTop){
    //   pomocnicza, wolana tylko, jak wykryjemy nowy top. ustawia nowe progi wejscia 
    // w globalnym obiekcie pomocniczym, z ktorego korzystaja ponizsze funkcje
    // analizujace co robic.

    // wyczysc stare punkty wejscia. to bedzie 2D array.
    ENTRY_POINTS_FOR_CURRENT_TOP = []

    //korzystajac ze zdefiniowanej strategii, ustal nowe kwoty punktow wejscia    
    STRATEGY_ENTRIES.forEach(entry => {
      //jaki procent topu liczymy? 85, 80, 75, 70... ?
      const percent = entry[0]

      //dodajemy nowy entry point. jest arrayem, 
      // gdzie na indeksie 0 mamy ile procent calej puli BTC ma byc uzyte na trejd,
      //a na indeksie 1 mamy konkretną kwotę poniżej ktorej należy dokonać zakupu
      ENTRY_POINTS_FOR_CURRENT_TOP.push([entry[1], percent * newTop / 100])
      
    })
    console.log(ENTRY_POINTS_FOR_CURRENT_TOP);
  }

  //   ===================================================================
  //   CZTERY FUNKCJE EGZEKUCYJNE, kontakt z baza danych:
//   ===================================================================

  function checkActiveTradesIfShouldSell(exchangeName = ''){
    //najpierw sprawdz czy to co juz mamy kupione nie powinno zostac sprzedane
    //przepatrz cala tablice ACTIVE_TRADES i jesli aktualna cena wzrosla ponad
    // cene jaka nas interesuje - UTWORZ NOWY ROZKAZ 'sprzedaj' dla machiny odpowiedzialnej
     //zapisz rozkaz - output - w DB.

     //sprawdz kazdy trejd czy jego prog do sprzedania nie zostal przekroczony
     ACTIVE_TRADES.forEach(trade => {
      if(trade.sellBackAt <= CURRENT_BINANCE_DATA.currentPrice){
        //jezeli zostal, to usun ten trejd z tablicy aktywnych:
        ACTIVE_TRADES = ACTIVE_TRADES.filter(remain => trade !== remain)

        // i zrealizuj zyski
        availableBTC += trade.amount * 1.06
         //utworz loga z tej sprzedazy
         const newLog = `sprzedałem po cenie ${CURRENT_BINANCE_DATA.currentPrice}
         następującą ilość: ${trade.amount * 1.06}
        dostępna pula BTC: ${availableBTC}`
        console.log(newLog)
        logArray.push(newLog)
        
      }
     })
     console.log(ACTIVE_TRADES);
  }
  
  function checkIfShouldBuyTheDip(exchangeName =''){
    //jesli cena spadla od szczytu o jakis procent ktory jest progiem do zakupu
    // UTWORZ NOWY ROZKAZ 'KUPUJ' za okreslony procent calosci portfela.
    //zapisz rozkaz - output - w DB.

    //obecna cena:
    const currentPrice = CURRENT_BINANCE_DATA.currentPrice
    //znajdz poziom wejscia, ktory zostal osiagniety
    const reachedPoint = ENTRY_POINTS_FOR_CURRENT_TOP.find(point => {
      return point[1] > currentPrice
    })
    //ULTRA WAZNE!!! sprawdz czy juz nie zakupiono wczesniej ponizej tego poziomu
    //zeby przypadkiem nie zdublowac trejda
    const alreadyBought = ACTIVE_TRADES.find(trade => {
      return trade.boughtAt <= reachedPoint
    })
    //jesli jakis poziom zostal przelamany 
    // ORAZ jeszcze nie kupiono ponizej tego poziomu, to kup!
    if(reachedPoint && !alreadyBought){
      //oblicz ile kupic
      const amountToBuy =  reachedPoint[0] * availableBTC / 100

      //utworz loga z tego zakupu
      const newLog = `poziom wejscia na ${reachedPoint[1]} osiagniety. 
      udalo mi sie kupic po cenie ${currentPrice} 
      nastepujaca ilosc ${amountToBuy}`
      console.log(newLog)
      logArray.push(newLog)
      
      //utworz obiekt informacyjny i dodaj go do ACTIVE_TRADES!
      const newTrade = {        
          where: 'binance',
          workerID: 'druhmachinaBinance',
          ticker: 'BTCUSDC',
          boughtAt: CURRENT_BINANCE_DATA.currentPrice,
          //sprzedajemy 6% drozej liczac od hipotetycznego punktu wejscia,
          // a nie od ceny po jakiej kupilismy, czyli zarabiamy troche wiecej niz 6%
          sellBackAt: reachedPoint[1] * 1.06,
          amount: amountToBuy         
      }
      ACTIVE_TRADES.push(newTrade)

      //KUP - odejmij od puli dostepnego BTC
      availableBTC -= amountToBuy
      console.log(availableBTC);
    }
  }
  
  function checkForArbitrageOpportunity(exchange1, exchange2, exchange3){
    //analizuje roznice w cenie dla danej pary na trzech gieldach,
    //cene posrednia odrzuca, porownuje najtansza i najdrozsza
    //jesli jest jakas superokazja typu 5% spreada to sprzedaje
    // na jednej gieldzie a na drugiej kupuje taka sama ilosc- 
    //zapisuje dwa rozkazy-outputy- w dwoch osobnych tabelach DB.
  }
  
  function writePassiveLog(){
      //wykonuje sie tylko jesli nie ma podstaw do sprzedania/kupienia/arbitrazu.
    //   czyli najczesciej. zapisuje rekord w DB ze statusem 'pending' i akcja 'HODL'
    //gdy druchmachina odczyta rekord z taka akcja, zmienia w bazie status 'pending'
    //na 'read' zeby potwierdzic, ze odczytala poprawnie.
  }



// ======================================================
// FRONTENDOWE FUNKCJE DO WYSWIETLANIA W PRZEGLADARCE
// ======================================================

//funkcja liczaca total zarobiony BTC na koniec
  function countAllBTC(){
    const countBTCfrozenInActiveTrades = ACTIVE_TRADES.reduce((acc, trade) =>{
      acc += trade.amount
      return acc
    }, 0)
    return countBTCfrozenInActiveTrades + availableBTC
  }
  //funkcja wyswietlajaca wszystkie logi z trejdow w UI:
  function showLogs(){
    logArray.forEach((log, index) => {
      const logEl = document.createElement('p')
      logEl.innerText = `log ${index}:
      ${log}
      
      `
      logger.appendChild(logEl)
    })
    
  }

  //funkcja odpowiedzialna za wykonanie wszystkich ruchow i wyswietlenie w UI
  function runSimulation(){
    //wyciag dane (ceny) z user inputa
    const inputValue = input.value
    const inputArray = inputValue.split(',').map(value => parseFloat(value))
    console.log(inputArray);   

    //przemiel przez wszystkie funkcje kazda wprowadzona do symulacji zmiane ceny.
    inputArray.forEach(price =>{
      setPreviousPriceAndCurrentPrice(price)
      checkForNewTop()
      checkActiveTradesIfShouldSell()
      checkIfShouldBuyTheDip()
    })

    //wyswietl finalny osiagniety wynik w UI
    totalBTC.innerText = countAllBTC()
    console.log(countAllBTC());

    //pokaz logi w UI
    showLogs()
  }

  //odpal cala symulacje po kliknieciu na button
simulateBtn.addEventListener('click', ()=>{
  runSimulation()
})




// const prices = [44.5,43,40,35,40,42,41,35,30,37,31,25,48,17]



// prices.forEach(price =>{
//   setPreviousPriceAndCurrentPrice(price)
//   checkForNewTop()
//   checkActiveTradesIfShouldSell()
//   checkIfShouldBuyTheDip()


//   console.log(countAllBTC());
// })