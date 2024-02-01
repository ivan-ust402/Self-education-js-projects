import { createStore } from 'vuex'
// Утилита для выполнения HTTP-запросов
import axios from 'axios'

// Адрес сервера
const SERVER_URL = 'http://localhost:5000/todos'

// Асинхронная операция - получение задач от сервера
const getTodos = async () => {
 try {
  //  const { data: todos } = await axios(SERVER_URL)
  const { data: todos } = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(axios(SERVER_URL));
    }, 1000)
  });
   // возвращаем задачи и сообщение об успехе
   return {
     todos,
     message: { type: 'success', text: 'Todos has been loaded' }
   }
 } catch (err) {
   console.error(err.toJSON())
   // возвращаем сообщение об ошибке
   return {
     message: {
       type: 'error',
       text: 'Something went wrong. Try again later'
     }
   }
 }
}

// Асинхронная операция - сохранение задач в БД
const postTodos = async (newTodos) => {
 try {
   // получаем данные - существующие задачи
  //  const { data: existingTodos } = await axios(SERVER_URL)
  const { data: existingTodos } = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(axios(SERVER_URL));
    }, 1000)
  });

   // перебираем существующие задачи
   for (const todo of existingTodos) {
     // формируем `URL` текущей задачи
     const todoUrl = `${SERVER_URL}/${todo.id}`

     // пытаемся найти общую задачу
     const commonTodo = newTodos.find((_todo) => _todo.id === todo.id)

     // если получилось
     if (commonTodo) {
       // определяем наличие изменений
       if (
         !Object.entries(commonTodo).every(
           ([key, value]) => value === todo[key]
         )
       ) {
         // если изменения есть, обновляем задачу на сервере,
         // в противном случае, ничего не делаем
         await axios.put(todoUrl, commonTodo)
       }
     } else {
       // если общая задача отсутствует, удаляем задачу на сервере
       await axios.delete(todoUrl)
     }
   }

   // перебираем новые задачи и сравниваем их с существующими
   for (const todo of newTodos) {
     // если новой задачи нет среди существующих
     if (!existingTodos.find((_todo) => _todo.id === todo.id)) {
       // сохраняем ее в БД
       await axios.post(SERVER_URL, todo)
     }
   }
   // сообщение об успехе операции
   return {
     type: 'success',
     text: 'Todos has been saved'
   }
 } catch (err) {
   console.error(err.toJSON())
   // сообщение о провале операции
   return {
     type: 'error',
     text: 'Something went wrong. Try again later'
   }
 }
}

// Создаем и экспортируем хранилище
export default createStore({
 // Начальное состояние
 state: {
   // для задач
   todos: [],
   // для статуса приложения
   status: 'idle',
   // для сообщения
   message: {},
   // для фильтра
   filter: 'all'
 },
 // Мутации - синхронная модификация состояния
 mutations: {
   // добавление задач
   ['SET_TODOS'](state, { todos, message }) {
     if (todos) {
       state.todos = todos
     }
     state.message = message
     state.status = 'idle'
   },
   // установка статуса
   ['SET_STATUS'](state, status) {
     state.status = status
   },
   // добавление новой задачи
   ['ADD_TODO'](state, todo) {
     state.todos.push(todo)
   },
   // удаление задачи
   ['REMOVE_TODO'](state, todo) {
     state.todos.splice(state.todos.indexOf(todo), 1)
   },
   // обновление задачи
   ['UPDATE_TODO'](state, { id, changes }) {
     const index = state.todos.findIndex((todo) => todo.id === id)
     state.todos.splice(index, 1, { ...state.todos[index], ...changes })
   },
   // завершение всех активных задач
   ['COMPLETE_TODOS'](state) {
     state.todos = state.todos.map((todo) =>
       todo.done ? todo : { ...todo, done: !todo.done }
     )
   },
   // удаление завершенных задач
   ['CLEAR_COMPLETED'](state) {
     state.todos = state.todos.filter((todo) => !todo.done)
   },
   // сохранение задач в БД
   ['SAVE_TODOS'](state, message) {
     state.message = message
     state.status = 'idle'
   },
   // установка фильтра
   ['SET_FILTER'](state, filter) {
     state.filter = filter
   },
   // очистка сообщения
   ['CLEAR_MESSAGE'](state) {
     state.message = {}
   }
 },
 // Операции - асинхронная логика и вызов мутаций
 actions: {
   // получение задач от сервера
   fetchTodos({ commit, dispatch, state }) {
     state.status = 'loading'
     getTodos()
       .then((todos) => {
         commit('SET_TODOS', todos)
       })
       .then(() => {
         dispatch('giveMeSomeTime')
       })
   },
   // установка статуса
   setStatus({ commit }, status) {
     commit('SET_STATUS', status)
   },
   // добавление новой задачи
   addTodo({ commit }, todo) {
     commit('ADD_TODO', todo)
   },
   // обновление задачи
   updateTodo({ commit }, payload) {
     commit('UPDATE_TODO', payload)
   },
   // удаление задачи
   removeTodo({ commit }, id) {
     commit('REMOVE_TODO', id)
   },
   // завершение всех активных задач
   completeTodos({ commit }) {
     commit('COMPLETE_TODOS')
   },
   // удаление завершенных задач
   clearCompleted({ commit }) {
     commit('CLEAR_COMPLETED')
   },
   // сохранение задач в БД
   saveTodos({ commit, state, dispatch }) {
     state.status = 'loading'
     postTodos(state.todos)
       .then((message) => {
         commit('SAVE_TODOS', message)
       })
       .then(() => {
         dispatch('giveMeSomeTime')
       })
   },
   // установка фильтра
   setFilter({ commit }, filter) {
     commit('SET_FILTER', filter)
   },
   // выполнение задержки перед очисткой сообщения
   giveMeSomeTime({ commit }) {
     const timerId = setTimeout(() => {
       commit('CLEAR_MESSAGE')
       clearTimeout(timerId)
     }, 1500)
   }
 },
 // Геттеры - получение части состояния
 getters: {
   // получение отфильтрованных задач
   filteredTodos: ({ todos, filter }) => {
     if (filter === 'all') return todos
     return filter === 'active'
       ? todos.filter((todo) => !todo.done)
       : todos.filter((todo) => todo.done)
   },
   // получение статистики
   todoStats: ({ todos }) => {
     const total = todos.length
     const completed = todos.filter((todo) => todo.done).length
     const active = total - completed
     const percent = total === 0 ? 0 : Math.round((active / total) * 100)

     return {
       total,
       completed,
       active,
       percent
     }
   }
 }
})
