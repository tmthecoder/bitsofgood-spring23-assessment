import app from "./api/endpoints";

app.listen(process.env.APP_PORT, () => {
  console.log(`api listening at http://localhost:${process.env.APP_PORT}`);
});
