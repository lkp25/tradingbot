

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
const ENTRY_POINTS_FOR_CURRENT_TOP = {
    first: 40000,
    second: 38000,
    third: 36000
}
// ALTERNATYWNIE:
//ten obiekt pomocniczy moze byc tez tablica po prostu, 
// byc moze tak bedzie wygodniej po nim iterowac sprawdzajac 
// czy cena przekroczyla jakis poziom:
// ENTRY_POINTS_FOR_CURRENT_TOP = [ 40000, 38000, 36000]
  

  
//tablica zawierajaca dane o aktualnych zakupach. Mozna rozwazyc osobna
// tabele w DB ktora trzyma te same dane wrazie wu jakby z jakiegos powodu
// skrypt sie wy738al na ryj i utracil dane z pamieci podrecznej.
  const ACTIVE_TRADES = [
    // {
    //   where: 'binance',
    //   workerID: 'druhmachinaBinance',
    //   ticker: 'BTCUSDC',
    //   boughtAt: 10000,
    //   sellBackAt: 10600, //obliczone po jakiej kwocie ma sprzedac z zyskiem
    //   amount: 0.2
    // },
   
    
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
    if(CURRENT_BINANCE_DATA.currentTop < CURRENT_BINANCE_DATA.currentPrice){
      CURRENT_BINANCE_DATA.currentTop = CURRENT_BINANCE_DATA.currentPrice
    }
    console.log(CURRENT_BINANCE_DATA);
  }

  function setNewEntryPoints(newTop){
    //   pomocnicza, wolana tylko, jak wykryjemy nowy top. ustawia nowe progi wejscia 
    // w globalnym obiekcie pomocniczym, z ktorego korzystaja ponizsze funkcje
    // analizujace co robic.
  }

  //   ===================================================================
  //   CZTERY FUNKCJE EGZEKUCYJNE, kontakt z baza danych:
//   ===================================================================

  function checkActiveTradesIfShouldSell(exchangeName){
    //najpierw sprawdz czy to co juz mamy kupione nie powinno zostac sprzedane
    //przepatrz cala tablice ACTIVE_TRADES i jesli aktualna cena wzrosla ponad
    // cene jaka nas interesuje - UTWORZ NOWY ROZKAZ 'sprzedaj' dla machiny odpowiedzialnej
     //zapisz rozkaz - output - w DB.
  }
  
  function checkIfShouldBuyTheDip(exchangeName){
    //jesli cena spadla od szczytu o jakis procent ktory jest progiem do zakupu
    // UTWORZ NOWY ROZKAZ 'KUPUJ' za okreslony procent calosci portfela.
    //zapisz rozkaz - output - w DB.
    
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

const prices = [31,32,35,40,42,41,35,30,37,31,25,48]
let availableBTC = 10.0

prices.forEach(price =>{
  setPreviousPriceAndCurrentPrice(price)
  checkForNewTop()
})