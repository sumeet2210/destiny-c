-- A completed booking can be reviewed once, whether or not the student used
-- the pre-visit confirmation action. The unique booking_id constraint still
-- prevents multiple reviews for the same visit.
drop policy if exists "student reviews own completed booking" on reviews;

create policy "student reviews own completed booking" on reviews
  for insert with check (
    student_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = reviews.booking_id
        and b.student_id = auth.uid()
        and b.restaurant_id = reviews.restaurant_id
        and b.status = 'completed'
    )
  );
