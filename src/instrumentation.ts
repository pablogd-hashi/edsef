export async function register() {
  if (
    process.env.MEMORIA_TEST_MODE === "1" &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    const { setup } = await import("../tests/setup-pglite");
    await setup();
  }
}
